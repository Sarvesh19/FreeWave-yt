export interface Song {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: number;
  url: string;
  source: 'audius' | 'youtube';
  videoId?: string;
}
