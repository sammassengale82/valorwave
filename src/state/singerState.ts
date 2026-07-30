// src/state/singerState.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emit } from "@tauri-apps/api/event";

export interface PerformanceEntry {
  song: string;
  pitch: number;      // 0–1
  timing: number;     // 0–1
  date: number;       // timestamp
}

export interface SingerStats {
  totalSongsSung: number;
  lastSungAt?: number;
  averageWaitMs: number;

  // used by audioEngine / UI
  avgPitch: number;             // 0–1
  avgTiming: number;            // 0–1
  bestSong?: string | null;
}

export interface Singer {
  id: string | number;
  name: string;
  song: string | null;
  notes: string | null;
  addedAt: number;
  onHold: boolean;

  requested_song?: string;
  request_count: number;
  sung_count: number;

  favoriteSongs: string[];
  performanceHistory: PerformanceEntry[];
  stats: SingerStats;
  cdg_path: string | null;
  avgPitch: number;
}

export type SingerProfile = Singer;

interface PendingRequest {
  singerId: string | number | null;
  song: string;
}

interface SingerState {
  singers: Singer[];
  queue: (string | number | null)[];
  history: (string | number | null)[];
  activeSinger: string | number | null;

  setSingers: (list: Singer[]) => void;
  setActiveSinger: (id: string | number | null) => void;
  pendingRequests: PendingRequest[];

  addSinger: (name: string, notes?: string) => Promise<string>;
  removeSinger: (id: string | number | null) => void;
  bumpSinger: (id: string | number | null) => void;
  holdSinger: (id: string | number | null) => void;

  addPendingRequest: (singerId: string | number | null, song: string) => void;
  approveRequest: (index: number) => void;
  rejectRequest: (index: number) => void;

  addFavoriteSong: (singerId: string | number | null, song: string) => void;
  removeFavoriteSong: (singerId: string | number | null, song: string) => void;

  logPerformance: (singerId: string | number | null, song: string) => void;

  nextSinger: () => Singer | null;
  markSingerDone: () => void;
}

export const useSingerState = create<SingerState>()(
  persist(
    (set, get) => ({
      singers: [],
      queue: [],
      history: [],
      activeSinger: null,

      setSingers: (singers) => set({ singers }),
      setActiveSinger: (id) => set({ activeSinger: id }),
      pendingRequests: [],

      addSinger: async (name, notes) => {
        const id = crypto.randomUUID();

        set((state) => ({
          singers: [
            ...state.singers,
            {
              id,
              name,
              song: null,
              notes: notes ?? null,
              addedAt: Date.now(),
              onHold: false,
              requested_song: undefined,
              request_count: 0,
              sung_count: 0,
              favoriteSongs: [],
              performanceHistory: [],
              stats: {
                totalSongsSung: 0,
                averageWaitMs: 0,
                avgPitch: 0,
                avgTiming: 0,
                bestSong: null,
              },
              cdg_path: null,
              avgPitch: 0,
            },
          ],
          queue: [...state.queue, id],
        }));

        return id;
      },

      removeSinger: (id) =>
        set((state) => {
          const newState = {
            singers: state.singers.filter((s) => s.id !== id),
            queue: state.queue.filter((q) => q !== id),
            history: state.history.filter((h) => h !== id),
            activeSinger: state.activeSinger === id ? null : state.activeSinger,
          };
          emit("queue_updated", {});
          return newState;
        }),

      bumpSinger: (id) =>
        set((state) => {
          const q = state.queue.filter((x) => x !== id);
          const newState = { queue: [id, ...q] };
          emit("queue_updated", {});
          return newState;
        }),

      holdSinger: (id) =>
        set((state) => {
          const newState = {
            singers: state.singers.map((s) =>
              s.id === id ? { ...s, onHold: !s.onHold } : s
            ),
          };
          emit("queue_updated", {});
          return newState;
        }),

      addPendingRequest: (singerId, song) =>
        set((state) => {
          const newState = {
            pendingRequests: [...state.pendingRequests, { singerId, song }],
          };
          emit("queue_updated", {});
          return newState;
        }),

      approveRequest: (index) =>
        set((state) => {
          const req = state.pendingRequests[index];
          if (!req) return state;

          const newState = {
            pendingRequests: state.pendingRequests.filter((_, i) => i !== index),
            singers: state.singers.map((s) =>
              s.id === req.singerId ? { ...s, requested_song: req.song } : s
            ),
          };
          emit("queue_updated", {});
          return newState;
        }),

      rejectRequest: (index) =>
        set((state) => {
          const newState = {
            pendingRequests: state.pendingRequests.filter((_, i) => i !== index),
          };
          emit("queue_updated", {});
          return newState;
        }),

      addFavoriteSong: (singerId, song) =>
        set((state) => {
          const newState = {
            singers: state.singers.map((s) =>
              s.id === singerId
                ? {
                    ...s,
                    favoriteSongs: Array.from(
                      new Set([...s.favoriteSongs, song])
                    ),
                  }
                : s
            ),
          };
          emit("queue_updated", {});
          return newState;
        }),

      removeFavoriteSong: (singerId, song) =>
        set((state) => {
          const newState = {
            singers: state.singers.map((s) =>
              s.id === singerId
                ? {
                    ...s,
                    favoriteSongs: s.favoriteSongs.filter((x) => x !== song),
                  }
                : s
            ),
          };
          emit("queue_updated", {});
          return newState;
        }),

      logPerformance: (singerId, song) =>
        set((state) => {
          const now = Date.now();

          const newState = {
            singers: state.singers.map((s) => {
              if (s.id !== singerId) return s;

              const totalSongsSung = s.stats.totalSongsSung + 1;
              const averageWaitMs =
                (s.stats.averageWaitMs * s.stats.totalSongsSung +
                  (now - s.addedAt)) /
                totalSongsSung;

              const newEntry: PerformanceEntry = {
                song,
                pitch: 0,   // placeholder until real pitch is wired
                timing: 0,  // placeholder until real timing is wired
                date: now,
              };

              return {
                ...s,
                performanceHistory: [...s.performanceHistory, newEntry],
                stats: {
                  ...s.stats,
                  totalSongsSung,
                  lastSungAt: now,
                  averageWaitMs,
                },
              };
            }),
          };

          emit("queue_updated", {});
          return newState;
        }),

      nextSinger: () => {
        const state = get();
        const nextId = state.queue.find(
          (id) => !state.singers.find((s) => s.id === id)?.onHold
        );
        if (!nextId) return null;

        set({ activeSinger: nextId });
        return state.singers.find((s) => s.id === nextId) || null;
      },

      markSingerDone: () =>
        set((state) => {
          if (state.activeSinger == null) return state;

          const id = state.activeSinger;
          const singer = state.singers.find((s) => s.id === id);

          if (singer?.requested_song) {
            get().logPerformance(id, singer.requested_song);
          }

          const newState = {
            history: [...state.history, id],
            queue: [...state.queue.filter((q) => q !== id), id],
            activeSinger: null,
          };
          emit("queue_updated", {});
          emit("karaoke_queue", { queue: state.queue });
          return newState;
        }),
    }),
    { name: "valorwave-singers" }
  )
);
