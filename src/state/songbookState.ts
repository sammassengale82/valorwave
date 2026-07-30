import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";

export interface SongEntry {
  id: string;
  title: string;
  artist: string;
  path: string;
  is_karaoke: boolean;
  request_count: number;
  sung_count: number;
  favorite_count: number;
}

interface Filters {
  karaokeOnly: boolean;
  artist: string | null;
  genre: string | null;
  decade: string | null;
}

interface SongbookState {
  dbFolders: string[];
  songs: SongEntry[];
  filters: Filters;

  loadSongbook: () => Promise<void>;
  setFilters: (filters: Partial<Filters>) => void;

  rankedSongs: (query: string, singerId?: string) => SongEntry[];
}

export const useSongbookState = create<SongbookState>((set, get) => ({
  dbFolders: [],
  songs: [],
  filters: {
    karaokeOnly: false,
    artist: null,
    genre: null,
    decade: null,
  },

  // ⭐ Load from Tauri DB
  loadSongbook: async () => {
    const db = await invoke<{ songs: SongEntry[]; folders?: string[] }>("load_song_database");
    set({ songs: db.songs, dbFolders: db.folders ?? [] });
  },

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  // ⭐ Smart search ranking
  rankedSongs: (query, singerId) => {
    const state = get();
    const q = query.toLowerCase();

    // Load singer data if needed
    let singer: any = null;
    if (singerId) {
      const singerState = (window as any).useSingerState?.getState?.();
      singer = singerState?.singers?.find((s: any) => s.id === singerId);
    }

    return state.songs
      .map((song) => {
        let score = 0;

        const title = song.title.toLowerCase();
        const artist = song.artist.toLowerCase();

        // Basic ranking
        if (title === q) score += 100;
        if (title.startsWith(q)) score += 50;
        if (title.includes(q)) score += 20;
        if (artist.includes(q)) score += 20;

        // Karaoke-only filter
        if (state.filters.karaokeOnly && !song.is_karaoke) score -= 9999;

        // Singer favorites
        if (singer?.favoriteSongs?.includes(song.path)) score += 40;

        // Singer history
        if (singer?.performanceHistory?.some((h: any) => h.song === song.path))
          score += 30;

        return { song, score };
      })
      .filter((x) => x.score > -9999)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.song);
  },
}));
