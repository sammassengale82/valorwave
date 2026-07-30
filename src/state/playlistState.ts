// src/state/playlistState.ts
import { create } from "zustand";

export interface PlaylistTrack {
  id: string;
  title: string;
  artist?: string;
  path: string;
}

interface PlaylistState {
  playlists: Record<string, PlaylistTrack[]>;
  currentPlaylistId: string | null;

  setCurrentPlaylist: (id: string) => void;
  addPlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: PlaylistTrack) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
}

export const usePlaylistState = create<PlaylistState>((set) => ({
  playlists: {},
  currentPlaylistId: null,

  setCurrentPlaylist: (id) => set({ currentPlaylistId: id }),

  addPlaylist: (id) =>
    set((state) => ({
      playlists: {
        ...state.playlists,
        [id]: state.playlists[id] ?? [],
      },
      currentPlaylistId: id,
    })),

  addTrackToPlaylist: (playlistId, track) =>
    set((state) => ({
      playlists: {
        ...state.playlists,
        [playlistId]: [...(state.playlists[playlistId] ?? []), track],
      },
    })),

  removeTrackFromPlaylist: (playlistId, trackId) =>
    set((state) => ({
      playlists: {
        ...state.playlists,
        [playlistId]: (state.playlists[playlistId] ?? []).filter(
          (t) => t.id !== trackId
        ),
      },
    })),
}));
