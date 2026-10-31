import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { Song } from '@/types/song';

function resolveBin(): string {
  if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH;
  const candidates = [
    '/opt/homebrew/bin/yt-dlp',
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp',
    `${process.env.HOME || ''}/.local/bin/yt-dlp`,
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return 'yt-dlp';
}

const BIN = resolveBin();

const YT_MUSIC_CHARTS = {
  top: 'PL4fGSI1pDJn6O1LS0XSdF3RyO0Rq_LDeI',
};

function run(args: string[], timeoutMs = 45000): Promise<string> {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      reject(
        new Error(
          `Could not start yt-dlp (${BIN}). Install it with "brew install yt-dlp" or "pip install -U yt-dlp", or set YTDLP_PATH.`
        )
      );
      return;
    }

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('yt-dlp timed out'));
    }, timeoutMs);

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(
        new Error(
          `yt-dlp not available (${err.message}). Install with "brew install yt-dlp".`
        )
      );
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.trim().split('\n').pop() || `yt-dlp exited ${code}`));
    });
  });
}

interface YtEntry {
  id?: string;
  title?: string;
  duration?: number;
  uploader?: string;
  channel?: string;
  artist?: string;
  thumbnails?: { url: string }[];
}

function toSong(entry: YtEntry): Song | null {
  const id = entry.id;
  if (!id || !entry.title) return null;

  const channel = entry.uploader || entry.channel || entry.artist;
  let artist = channel;
  if (!artist) {
    const match = entry.title.match(/^(.+?)\s[-–—]\s/);
    artist = match ? match[1] : 'YouTube';
  }

  return {
    id: `yt_${id}`,
    title: entry.title,
    artist,
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    duration: entry.duration,
    url: `/api/yt/stream?id=${id}`,
    source: 'youtube',
    videoId: id,
  };
}

function parseEntries(json: string, limit: number): Song[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return [];
  }
  const obj = data as { entries?: YtEntry[] } & YtEntry;
  const entries = Array.isArray(obj.entries) ? obj.entries : [obj];
  return entries
    .slice(0, limit)
    .map(toSong)
    .filter((s): s is Song => s !== null);
}

export async function searchYt(query: string, limit = 20): Promise<Song[]> {
  const json = await run([
    `ytsearch${limit}:${query}`,
    '--flat-playlist',
    '--dump-single-json',
    '--no-warnings',
    '--no-progress',
  ]);
  return parseEntries(json, limit);
}

export async function chartsYt(limit = 30): Promise<Song[]> {
  const json = await run([
    `https://music.youtube.com/playlist?list=${YT_MUSIC_CHARTS.top}`,
    '--flat-playlist',
    '--dump-single-json',
    '--no-warnings',
    '--no-progress',
    '--playlist-end',
    String(limit),
  ]);
  return parseEntries(json, limit);
}

const urlCache = new Map<string, { url: string; expires: number }>();
const pending = new Map<string, Promise<string>>();
const URL_TTL = 20 * 60 * 1000;

export function invalidateAudioUrl(videoId: string): void {
  urlCache.delete(videoId);
}

async function resolveAudioUrl(videoId: string): Promise<string> {
  const now = Date.now();
  const cached = urlCache.get(videoId);
  if (cached && cached.expires > now) return cached.url;

  const existing = pending.get(videoId);
  if (existing) return existing;

  const promise = (async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const args = [
          'https://www.youtube.com/watch?v=' + videoId,
          '-f',
          'bestaudio[ext=m4a]/bestaudio/best',
          '-g',
          '--no-warnings',
          '--no-progress',
        ];
        // The android client yields a normal progressive URL that supports
        // full/range requests. The default web client often returns a
        // segmented URL that 403s without a bounded range. Fall back on the
        // second attempt in case the android client is unavailable.
        if (attempt !== 1) {
          args.push('--extractor-args', 'youtube:player_client=android');
        }

        const out = await run(args);

        const url = out
          .trim()
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.startsWith('http'))
          .pop();

        if (!url) throw new Error('No audio stream URL returned by yt-dlp');
        urlCache.set(videoId, { url, expires: Date.now() + URL_TTL });
        return url;
      } catch (err) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Could not resolve audio');
  })();

  pending.set(videoId, promise);
  try {
    return await promise;
  } finally {
    pending.delete(videoId);
  }
}

export async function getAudioUrl(videoId: string): Promise<string> {
  return resolveAudioUrl(videoId);
}
