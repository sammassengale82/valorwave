import { create } from "zustand";

export interface SamplerPad {
  id: number;
  name: string;
  file: File | null;
  volume: number;
  pitch: number;
  loop: boolean;
}

interface SamplerState {
  pads: SamplerPad[];
  setPadFile: (id: number, file: File) => void;
  setPadVolume: (id: number, volume: number) => void;
  setPadPitch: (id: number, pitch: number) => void;
  togglePadLoop: (id: number) => void;
}

export const useSamplerState = create<SamplerState>((set) => ({
  pads: Array.from({ length: 8 }).map((_, i) => ({
    id: i + 1,
    name: `Pad ${i + 1}`,
    file: null,
    volume: 1,
    pitch: 1,
    loop: false,
  })),

  setPadFile: (id, file) =>
    set((state) => ({
      pads: state.pads.map((p) =>
        p.id === id ? { ...p, file } : p
      ),
    })),

  setPadVolume: (id, volume) =>
    set((state) => ({
      pads: state.pads.map((p) =>
        p.id === id ? { ...p, volume } : p
      ),
    })),

  setPadPitch: (id, pitch) =>
    set((state) => ({
      pads: state.pads.map((p) =>
        p.id === id ? { ...p, pitch } : p
      ),
    })),

  togglePadLoop: (id) =>
    set((state) => ({
      pads: state.pads.map((p) =>
        p.id === id ? { ...p, loop: !p.loop } : p
      ),
    })),
}));
