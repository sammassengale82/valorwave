import { create } from "zustand";
import { useSingerState } from "./singerState";

interface ETAState {
  getETA: (singerId: string) => number; // milliseconds
}

export const useETAState = create<ETAState>(() => ({
  getETA: (singerId: string) => {
    const { queue, singers } = useSingerState.getState();

    // Find singer position
    const index = queue.indexOf(singerId);
    if (index === -1) return 0;

    // Average karaoke song length (3.5 minutes)
    const avgSongMs = 3.5 * 60 * 1000;

    // Average transition time (20 seconds)
    const transitionMs = 20 * 1000;

    // ETA = (# singers ahead * avgSongMs) + (# transitions * transitionMs)
    const singersAhead = index;
    const etaMs = singersAhead * (avgSongMs + transitionMs);

    return etaMs;
  },
}));
