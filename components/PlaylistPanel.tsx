'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Music, X } from 'lucide-react';
import { usePlaylistStore } from '@/store/playlistStore';
import { usePlayerStore } from '@/store/playerStore';

export default function PlaylistPanel() {
  const { playlists, createPlaylist, deletePlaylist, removeSongFromPlaylist } = usePlaylistStore();
  const { setQueue, setCurrentSong, setIsPlaying } = usePlayerStore();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    usePlaylistStore.persist.rehydrate();
    setMounted(true);
  }, []);

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      const playlist = createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreateForm(false);
      setSelectedPlaylist(playlist.id);
    }
  };

  const playPlaylist = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist && playlist.songs.length > 0) {
      setQueue(playlist.songs);
      setCurrentSong(playlist.songs[0]);
      setIsPlaying(true);
    }
  };

  const currentPlaylist = playlists.find((p) => p.id === selectedPlaylist);

  return (
    <div className="bg-neutral-900 rounded-lg p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Playlists</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="p-2 hover:bg-neutral-800 rounded-full"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Playlist name"
            className="flex-1 px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button onClick={handleCreate} className="px-2 py-1 bg-blue-600 rounded text-sm">
            Create
          </button>
        </div>
      )}

      <div className="space-y-2">
        {mounted && playlists.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            No playlists yet.<br />Click + to create one.
          </p>
        )}
        {playlists.map((playlist) => (
          <div key={playlist.id}>
            <button
              onClick={() => setSelectedPlaylist(playlist.id === selectedPlaylist ? null : playlist.id)}
              className={`w-full flex items-center justify-between p-2 rounded hover:bg-neutral-800 ${
                selectedPlaylist === playlist.id ? 'bg-neutral-800' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                <span className="truncate">{playlist.name}</span>
                <span className="text-xs text-gray-400">({playlist.songs.length})</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deletePlaylist(playlist.id);
                  if (selectedPlaylist === playlist.id) {
                    setSelectedPlaylist(null);
                  }
                }}
                className="p-1 hover:bg-red-600 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </button>
            {selectedPlaylist === playlist.id && currentPlaylist && (
              <div className="mt-2 ml-2 space-y-1 max-h-60 overflow-y-auto">
                <button
                  onClick={() => playPlaylist(playlist.id)}
                  disabled={currentPlaylist.songs.length === 0}
                  className="w-full text-left px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded mb-2"
                >
                  Play All
                </button>
                {currentPlaylist.songs.map((song) => (
                  <div key={song.id} className="flex items-center gap-2 p-1 hover:bg-neutral-800 rounded group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate">{song.title}</p>
                      <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                    </div>
                    <button
                      onClick={() => removeSongFromPlaylist(playlist.id, song.id)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {currentPlaylist.songs.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">No songs yet</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
