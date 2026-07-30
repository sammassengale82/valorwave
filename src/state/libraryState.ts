import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TrackMetadata {
  id: string;
  path: string;
  filename: string;
  title: string;
  artist: string;
  duration: number;
  bpm?: number;
  key?: string;
  is_karaoke: boolean;
  cdgPath?: string;
  zipPath?: string;
}

export interface Crate {
  id: string;
  name: string;
  trackIds: string[];
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

export interface PlayHistoryEntry {
  id: string;
  trackId: string;
  playedAt: number;
}

interface LibraryState {
  tracks: Record<string, TrackMetadata>;
  crates: Crate[];
  playlists: Playlist[];

  currentPlaylistId: string | null;

  searchQuery: string;
  setSearchQuery: (q: string) => void;

  addTrack: (track: TrackMetadata) => void;
  addTracks: (tracks: TrackMetadata[]) => void;

  addCrate: (name: string) => void;
  addPlaylist: (name: string) => void;

  addTrackToCrate: (crateId: string, trackId: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;

  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylistTrack: (playlistId: string, fromIndex: number, toIndex: number) => void;

  setCurrentPlaylist: (playlistId: string) => void;

  playNextQueue: string[];
  addToPlayNext: (trackId: string) => void;
  popNextTrack: () => string | null;

  history: PlayHistoryEntry[];
  logPlay: (trackId: string) => void;
}

export const useLibraryState = create<LibraryState>()(
  persist(
    (set, get) => ({
      tracks: {},
      crates: [],
      playlists: [],
      currentPlaylistId: null,

      searchQuery: "",
      setSearchQuery: (q) => set({ searchQuery: q }),

      addTrack: (track) =>
        set((state) => ({
          tracks: {
            ...state.tracks,
            [track.id]: track,
          },
        })),

      addTracks: (tracks) =>
        set((state) => {
          const newTracks = { ...state.tracks };
          tracks.forEach((t) => (newTracks[t.id] = t));
          return { tracks: newTracks };
        }),

      addCrate: (name) =>
        set((state) => ({
          crates: [
            ...state.crates,
            { id: crypto.randomUUID(), name, trackIds: [] },
          ],
        })),

      addPlaylist: (name) =>
        set((state) => ({
          playlists: [
            ...state.playlists,
            { id: crypto.randomUUID(), name, trackIds: [] },
          ],
        })),

      addTrackToCrate: (crateId, trackId) =>
        set((state) => ({
          crates: state.crates.map((c) =>
            c.id === crateId
              ? { ...c, trackIds: [...new Set([...c.trackIds, trackId])] }
              : c
          ),
        })),

      addTrackToPlaylist: (playlistId, trackId) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, trackIds: [...new Set([...p.trackIds, trackId])] }
              : p
          ),
        })),

      removeTrackFromPlaylist: (playlistId, trackId) =>
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  trackIds: p.trackIds.filter((id) => id !== trackId),
                }
              : p
          ),
        })),

      reorderPlaylistTrack: (playlistId, fromIndex, toIndex) =>
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const ids = [...p.trackIds];
            const [moved] = ids.splice(fromIndex, 1);
            ids.splice(toIndex, 0, moved);
            return { ...p, trackIds: ids };
          }),
        })),

      setCurrentPlaylist: (playlistId) => set({ currentPlaylistId: playlistId }),

      playNextQueue: [],
      addToPlayNext: (trackId) =>
        set((state) => ({
          playNextQueue: [...state.playNextQueue, trackId],
        })),
      popNextTrack: () => {
        const { playNextQueue } = get();
        if (playNextQueue.length === 0) return null;
        const [next, ...rest] = playNextQueue;
        set({ playNextQueue: rest });
        return next;
      },

      history: [],
      logPlay: (trackId) =>
        set((state) => ({
          history: [
            ...state.history,
            {
              id: crypto.randomUUID(),
              trackId,
              playedAt: Date.now(),
            },
          ],
        })),
    }),
    {
      name: "valorwave-library",
    }
  )
);
