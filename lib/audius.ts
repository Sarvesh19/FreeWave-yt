import { Song } from '@/types/song';

const AUDIUS_API = 'https://discoveryprovider.audius.co/v1';
const APP_NAME = 'FreeWave';

export interface AudiusTrack {
  id: string;
  title: string;
  duration: number;
  artwork?: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  } | null;
  user?: {
    name?: string;
    handle?: string;
  };
}

export function streamUrl(id: string): string {
  return `${AUDIUS_API}/tracks/${id}/stream?app_name=${APP_NAME}`;
}

export function toSong(track: AudiusTrack): Song {
  return {
    id: track.id,
    title: track.title,
    artist: track.user?.name || track.user?.handle || 'Unknown Artist',
    thumbnail: track.artwork?.['480x480'] || track.artwork?.['150x150'] || '',
    duration: track.duration,
    url: streamUrl(track.id),
    source: 'audius',
  };
}

export async function searchAudius(query: string): Promise<Song[]> {
  const res = await fetch(
    `${AUDIUS_API}/tracks/search?query=${encodeURIComponent(query)}&app_name=${APP_NAME}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`Audius search failed: ${res.status}`);
  const json = await res.json();
  return (json.data || []).map(toSong);
}

export async function trendingAudius(limit = 24): Promise<Song[]> {
  const res = await fetch(
    `${AUDIUS_API}/tracks/trending?app_name=${APP_NAME}&limit=${limit}`,
    { next: { revalidate: 600 } }
  );
  if (!res.ok) throw new Error(`Audius trending failed: ${res.status}`);
  const json = await res.json();
  return (json.data || []).map(toSong);
}
