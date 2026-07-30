import { create } from "zustand";

export type Panel =
  | "PerformanceDashboard"
  | "VenueMode"
  | "MediaSampler"
  | "ShowSummary"
  | "SingerQueue"
  | "PendingRequests"
  | "SingerProfile";
  
interface UIState {
  activePanel: Panel;
  setActivePanel: (p: Panel) => void;

  transparency: number;
  setTransparency: (v: number) => void;

  pinned: Panel[];
  togglePinned: (p: Panel) => void;
}

export const useUIState = create<UIState>((set) => ({
  activePanel: null,
  setActivePanel: (p) => set({ activePanel: p }),

  transparency: 1,
  setTransparency: (v) => set({ transparency: v }),

  pinned: [],
  togglePinned: (panel) =>
    set((state) => {
      const exists = state.pinned.includes(panel);
      return {
        pinned: exists
          ? state.pinned.filter((p) => p !== panel)
          : [...state.pinned, panel],
      };
    }),
}));

// SERIALIZABLE SNAPSHOT
export const getUISerializable = () => {
  const { activePanel, transparency, pinned } = useUIState.getState();
  return { activePanel, transparency, pinned };
};
