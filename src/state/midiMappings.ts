// src/state/midiMappings.ts
import { create } from "zustand";

interface MidiAction {
  type:
    | "play"
    | "stop"
    | "crossfader"
    | "gain"
    | "eq"
    | "karaoke"
    | "position";
  deck?: number;
  band?: "low" | "mid" | "high";
}

interface MidiMappingsState {
  mappings: Record<string, MidiAction>;
  addMapping: (key: string, action: MidiAction) => void;
}

export const useMidiMappings = create<MidiMappingsState>((set) => ({
  mappings: {},

  addMapping: (key, action) =>
    set((state) => ({
      mappings: {
        ...state.mappings,
        [key]: action,
      },
    })),
}));
