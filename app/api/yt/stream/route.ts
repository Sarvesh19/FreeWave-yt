import { NextRequest } from 'next/server';
import { getAudioUrl, invalidateAudioUrl } from '@/lib/ytdlp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FORWARD_HEADERS = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'last-modified',
  'etag',
];

async function fetchAudio(url: string, range?: string) {
  return fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: '*/*',
      ...(range ? { range } : {}),
    },
    cache: 'no-store',
  });
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return new Response('Missing video id', { status: 400 });
  }

  try {
    const range = request.headers.get('range') || undefined;

    let upstream: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const url = await getAudioUrl(id);
      upstream = await fetchAudio(url, range);
      if (upstream.ok || upstream.status === 206) break;
      invalidateAudioUrl(id);
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }

    if (!upstream || (!upstream.ok && upstream.status !== 206)) {
      return new Response(`Upstream error ${upstream?.status ?? 'unknown'}`, {
        status: 502,
      });
    }

    const headers = new Headers();
    for (const key of FORWARD_HEADERS) {
      const value = upstream.headers.get(key);
      if (value) headers.set(key, value);
    }
    if (!headers.has('content-type')) headers.set('content-type', 'audio/mp4');
    headers.set('cache-control', 'no-store');

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stream failed';
    console.error('yt stream error:', message);
    return new Response(`Stream error: ${message}`, { status: 502 });
  }
}

