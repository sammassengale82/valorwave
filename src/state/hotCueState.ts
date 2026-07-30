// src/state/hotCueState.ts
import { create } from "zustand";

export interface HotCue {
  id: number;
  deckId: number;
  time: number | null;
  color: string;
  name: string;
}

interface HotCueStore {
  [x: string]: any;
  cues: HotCue[];
  setHotCue: (deckId: number, id: number, time: number) => void;
  deleteHotCue: (deckId: number, id: number) => void;
  renameHotCue: (deckId: number, id: number, name: string) => void;
  recolorHotCue: (deckId: number, id: number, color: string) => void;
}

export const useHotCueState = create<HotCueStore>((set) => ({
  cues: [
    { id: 1, deckId: 1, time: null, color: "red", name: "" },
    { id: 2, deckId: 1, time: null, color: "green", name: "" },
    { id: 3, deckId: 1, time: null, color: "blue", name: "" },
    { id: 4, deckId: 1, time: null, color: "yellow", name: "" },
  ],

  setHotCue: (deckId, id, time) =>
    set((s) => ({
      cues: s.cues.map((c) =>
        c.deckId === deckId && c.id === id ? { ...c, time } : c
      ),
    })),

  deleteHotCue: (deckId, id) =>
    set((s) => ({
      cues: s.cues.map((c) =>
        c.deckId === deckId && c.id === id ? { ...c, time: null } : c
      ),
    })),

  renameHotCue: (deckId, id, name) =>
    set((s) => ({
      cues: s.cues.map((c) =>
        c.deckId === deckId && c.id === id ? { ...c, name } : c
      ),
    })),

  recolorHotCue: (deckId, id, color) =>
    set((s) => ({
      cues: s.cues.map((c) =>
        c.deckId === deckId && c.id === id ? { ...c, color } : c
      ),
    })),
}));
