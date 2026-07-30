import { create } from "zustand";

interface WindowState {
  djOpen: boolean;
  karaokeOpen: boolean;
  venueOpen: boolean;
  setDjOpen: (v: boolean) => void;
  setKaraokeOpen: (v: boolean) => void;
  setVenueOpen: (v: boolean) => void;
}

export const useWindowState = create<WindowState>((set) => ({
  djOpen: false,
  karaokeOpen: false,
  venueOpen: false,
  setDjOpen: (v) => set({ djOpen: v }),
  setKaraokeOpen: (v) => set({ karaokeOpen: v }),
  setVenueOpen: (v) => set({ venueOpen: v }),
}));
