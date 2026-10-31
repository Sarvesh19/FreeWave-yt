'use client';

import { useCallback, useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import SongCard from '@/components/SongCard';
import Player from '@/components/Player';
import PlaylistPanel from '@/components/PlaylistPanel';
import { Song } from '@/types/song';
import {
  Music2,
  TrendingUp,
  Search as SearchIcon,
  Loader2,
  Youtube,
  Radio,
  AlertCircle,
} from 'lucide-react';

type Source = 'youtube' | 'audius';

const SOURCE_KEY = 'freewave-source';

export default function Home() {
  const [source, setSource] = useState<Source>('youtube');
  const [results, setResults] = useState<Song[]>([]);
  const [home, setHome] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [homeLoading, setHomeLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(SOURCE_KEY) as Source | null;
    if (saved === 'youtube' || saved === 'audius') setSource(saved);
  }, []);

  const switchSource = (next: Source) => {
    if (next === source) return;
    setSource(next);
    localStorage.setItem(SOURCE_KEY, next);
    setQuery('');
    setResults([]);
    setError('');
  };

  const loadHome = useCallback(async (src: Source) => {
    setHomeLoading(true);
    setError('');
    try {
      const endpoint = src === 'youtube' ? '/api/yt/charts' : '/api/trending';
      const res = await fetch(endpoint);
      const data = await res.json();
      setHome(data.results || []);
      if (data.error) setError(data.error);
    } catch (err) {
      console.error(err);
      setHome([]);
      setError('Could not load music. Check your connection.');
    } finally {
      setHomeLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHome(source);
  }, [source, loadHome]);

  const handleSearch = async (q: string) => {
    setLoading(true);
    setQuery(q);
    setError('');
    try {
      const endpoint =
        source === 'youtube' ? '/api/yt/search' : '/api/search';
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
      if (data.error) setError(data.error);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setError('');
  };

  const list = query ? results : home;
  const isLoading = query ? loading : homeLoading;

  return (
    <main className="min-h-screen pb-28">
      <div className="max-w-7xl mx-auto p-4">
        <header className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
            <div className="flex items-center gap-3">
              <Music2 className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold">FreeWave</h1>
            </div>
            <div className="flex items-center rounded-lg bg-neutral-800 p-1 text-sm">
              <button
                onClick={() => switchSource('youtube')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  source === 'youtube'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Youtube className="w-4 h-4" />
                YouTube
              </button>
              <button
                onClick={() => switchSource('audius')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  source === 'audius'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Radio className="w-4 h-4" />
                Audius
              </button>
            </div>
          </div>
          <p className="text-gray-400 mb-6">
            Free music player. Search and stream, build playlists saved locally in
            your browser.
          </p>
          <SearchBar onSearch={handleSearch} loading={loading} />
          {query && (
            <button
              onClick={clearSearch}
              className="mt-3 text-sm text-blue-400 hover:text-blue-300"
            >
              ← Back to {source === 'youtube' ? 'charts' : 'trending'}
            </button>
          )}
        </header>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Something went wrong</p>
              <p className="text-red-300/80 break-words">{error}</p>
              {source === 'youtube' && (
                <p className="text-red-300/60 mt-1">
                  YouTube playback needs <code>yt-dlp</code> on the server:
                  <code> brew install yt-dlp</code>.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                {query ? (
                  <>
                    <SearchIcon className="w-5 h-5" />
                    Results for &ldquo;{query}&rdquo;
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    {source === 'youtube' ? 'Top 100 Songs' : 'Trending on Audius'}
                  </>
                )}
              </h2>

              {isLoading && (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Loading music...
                </div>
              )}

              {!isLoading && list.length === 0 && !error && (
                <div className="text-center py-16 text-gray-400">
                  <Music2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">
                    {query
                      ? 'No results found. Try another search.'
                      : 'Nothing here right now. Try searching.'}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {!isLoading &&
                  list.map((song) => <SongCard key={song.id} song={song} />)}
              </div>
            </section>
          </div>
          <div className="lg:col-span-1">
            <PlaylistPanel />
          </div>
        </div>
      </div>
      <Player />
    </main>
  );
}
