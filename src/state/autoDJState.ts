import { create } from "zustand";

interface AutoDJState {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}

export const useAutoDJState = create<AutoDJState>((set) => ({
  enabled: false,
  setEnabled: (v) => set({ enabled: v }),
}));
