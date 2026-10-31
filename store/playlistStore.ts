import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Playlist } from '@/types/playlist';
import { Song } from '@/types/song';

interface PlaylistState {
  playlists: Playlist[];
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  renamePlaylist: (id: string, name: string) => void;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [],
      createPlaylist: (name) => {
        const playlist: Playlist = {
          id: Date.now().toString(),
          name,
          songs: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          playlists: [...state.playlists, playlist],
        }));
        return playlist;
      },
      deletePlaylist: (id) => {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== id),
        }));
      },
      addSongToPlaylist: (playlistId, song) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id === playlistId) {
              const songExists = p.songs.find((s) => s.id === song.id);
              if (!songExists) {
                return {
                  ...p,
                  songs: [...p.songs, song],
                  updatedAt: Date.now(),
                };
              }
            }
            return p;
          }),
        }));
      },
      removeSongFromPlaylist: (playlistId, songId) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id === playlistId) {
              return {
                ...p,
                songs: p.songs.filter((s) => s.id !== songId),
                updatedAt: Date.now(),
              };
            }
            return p;
          }),
        }));
      },
      renamePlaylist: (id, name) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id === id) {
              return { ...p, name, updatedAt: Date.now() };
            }
            return p;
          }),
        }));
      },
    }),
    {
      name: 'freewave-playlists',
      skipHydration: true,
    }
  )
);
