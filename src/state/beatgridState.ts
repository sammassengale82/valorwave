import { create } from "zustand";

export interface Beatgrid {
  bpm: number;
  first_beat_sec: number;
  beats: number[];
  offset: number;
  tightened: boolean;
}

interface BeatgridState {
  grids: Record<number, Beatgrid | null>;
  setBeatgrid: (deckId: number, grid: Beatgrid) => void;
  shiftGrid: (deckId: number, amount: number) => void;
  tightenGrid: (deckId: number) => void;
}

export const useBeatgridState = create<BeatgridState>((set) => ({
  grids: {},
  setBeatgrid: (deckId, grid) =>
    set((state) => ({
      grids: { ...state.grids, [deckId]: grid },
    })),

  shiftGrid: (deckId, amount) =>
    set((state) => {
      const grid = state.grids[deckId];
      if (!grid) return state;
      grid.offset += amount;
      return { grids: { ...state.grids } };
    }),

  tightenGrid: (deckId) =>
    set((state) => {
      const grid = state.grids[deckId];
      if (!grid) return state;
      grid.tightened = true;
      return { grids: { ...state.grids } };
    }),
  
}));
