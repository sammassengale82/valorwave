// src/state/settingsState.ts
import { create } from "zustand";

interface SettingsState {
  audioOutput: string | null;
  audioInput: string | null;
  latency: number;
  theme: "dark" | "light";
  midiEnabled: boolean;

  setAudioOutput: (id: string) => void;
  setAudioInput: (id: string) => void;
  setLatency: (v: number) => void;
  setTheme: (t: "dark" | "light") => void;
  setMidiEnabled: (v: boolean) => void;
}

export const useSettingsState = create<SettingsState>((set) => ({
  audioOutput: null,
  audioInput: null,
  latency: 256,
  theme: "dark",
  midiEnabled: false,

  setAudioOutput: (id) => set({ audioOutput: id }),
  setAudioInput: (id) => set({ audioInput: id }),
  setLatency: (v) => set({ latency: v }),
  setTheme: (t) => set({ theme: t }),
  setMidiEnabled: (v) => set({ midiEnabled: v }),
}));
