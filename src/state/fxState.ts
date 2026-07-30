import { create } from "zustand";

export interface DeckFX {
  deckId: number;
  enabled: boolean;
  type: "filter" | "echo" | "reverb" | "flanger";
  wet: number;
  param: number; // filter cutoff, echo feedback, etc.
}

interface FXState {
  fx: DeckFX[];
  setFXEnabled: (deckId: number, enabled: boolean) => void;
  setFXType: (deckId: number, type: DeckFX["type"]) => void;
  setFXWet: (deckId: number, wet: number) => void;
  setFXParam: (deckId: number, param: number) => void;
}

export const useFXState = create<FXState>((set) => ({
  fx: [1, 2, 3, 4].map((id) => ({
    deckId: id,
    enabled: false,
    type: "filter",
    wet: 0,
    param: 0.5,
  })),

  setFXEnabled: (deckId, enabled) =>
    set((state) => ({
      fx: state.fx.map((f) =>
        f.deckId === deckId ? { ...f, enabled } : f
      ),
    })),

  setFXType: (deckId, type) =>
    set((state) => ({
      fx: state.fx.map((f) =>
        f.deckId === deckId ? { ...f, type } : f
      ),
    })),

  setFXWet: (deckId, wet) =>
    set((state) => ({
      fx: state.fx.map((f) =>
        f.deckId === deckId ? { ...f, wet } : f
      ),
    })),

  setFXParam: (deckId, param) =>
    set((state) => ({
      fx: state.fx.map((f) =>
        f.deckId === deckId ? { ...f, param } : f
      ),
    })),
}));
