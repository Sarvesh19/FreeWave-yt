'use client';

import { Song } from '@/types/song';
import { Play, Plus, ListPlus } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { usePlaylistStore } from '@/store/playlistStore';
import { useState } from 'react';

interface SongCardProps {
  song: Song;
}

function formatDuration(seconds?: number) {
  if (!seconds || !isFinite(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SongCard({ song }: SongCardProps) {
  const { setCurrentSong, setIsPlaying, setQueue, queue, addToQueue } = usePlayerStore();
  const { playlists, addSongToPlaylist } = usePlaylistStore();
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  const handlePlay = () => {
    const existing = queue.find((s) => s.id === song.id);
    if (!existing) setQueue([...queue, song]);
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const handleAddToQueue = () => {
    const exists = queue.find((s) => s.id === song.id);
    if (!exists) addToQueue(song);
  };

  const handleAddToPlaylist = (playlistId: string) => {
    addSongToPlaylist(playlistId, song);
    setShowPlaylistMenu(false);
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors group">
      <div className="relative flex-shrink-0">
        <img
          src={song.thumbnail || '/placeholder.svg'}
          alt={song.title}
          className="w-16 h-12 object-cover rounded bg-neutral-700"
        />
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded"
        >
          <Play className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{song.title}</h3>
        <p className="text-sm text-gray-400 truncate">{song.artist}</p>
      </div>
      <span className="text-xs text-gray-500 tabular-nums hidden sm:block">
        {formatDuration(song.duration)}
      </span>
      <div className="flex items-center gap-1">
        <div className="relative">
          <button
            onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
            className="p-2 hover:bg-neutral-600 rounded-full sm:opacity-0 group-hover:opacity-100 transition-opacity"
            title="Add to playlist"
          >
            <Plus className="w-4 h-4" />
          </button>
          {showPlaylistMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-20">
              <div className="p-2">
                <p className="text-xs uppercase tracking-wide text-gray-500 px-2 py-1">
                  Add to playlist
                </p>
                {playlists.length === 0 && (
                  <p className="text-sm text-gray-400 px-2 py-2">
                    No playlists yet. Create one first.
                  </p>
                )}
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-neutral-700 rounded truncate"
                  >
                    {playlist.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleAddToQueue}
          className="p-2 hover:bg-neutral-600 rounded-full sm:opacity-0 group-hover:opacity-100 transition-opacity"
          title="Add to queue"
        >
          <ListPlus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
