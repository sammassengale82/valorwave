import { create } from "zustand";

export type AutomixMode = "dj" | "karaoke" | "smart";
export type TransitionStyle = "smart" | "fade" | "cut" | "echo";

export interface AutomixTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key?: string | null;
  duration_sec?: number;
  intro_sec?: number;
  outro_sec?: number;
  energy: number;
  path: string;
}

export interface AutoMixState {
  // Pure State Attributes (Clean, unified flat store structure)
  enabled: boolean;
  fade_duration_sec: number;
  target_bpm: number | null;
  mode: AutomixMode;
  next_deck: number | null;
  queue: AutomixTrack[];
  transitionStyle: TransitionStyle;
  syncBPM: boolean;
  autoGain: boolean;
  autoEQ: boolean;
  isTransitioning: boolean; // Tracks active crossfades globally

  // Pure Action State Modifiers
  setEnabled: (enabled: boolean) => void;
  setMode: (mode: AutomixMode) => void;
  setTransitionStyle: (style: TransitionStyle) => void;
  setfade_duration_sec: (value: number) => void;
  setSyncBPM: (enabled: boolean) => void;
  setAutoGain: (enabled: boolean) => void;
  setAutoEQ: (enabled: boolean) => void;
  setTargetBpm: (bpm: number | null) => void;
  setQueue: (queue: AutomixTrack[]) => void;
  setIsTransitioning: (active: boolean) => void;

  // Pro-DJ Pipeline Engine Helpers
  addTrackToQueue: (track: AutomixTrack) => void;
  removeTrackFromQueue: (trackId: string) => void;
  advanceQueue: () => AutomixTrack | null; // Pops the current track when crossfade completes
  clearQueue: () => void;
}

export const useAutoMixState = create<AutoMixState>((set, get) => ({
  // Clean Initial Values
  enabled: false,
  fade_duration_sec: 6000, // Default to 6000ms (6 seconds) for crossfades
  target_bpm: null,
  mode: "dj",
  next_deck: null,
  queue: [],
  transitionStyle: "smart",
  syncBPM: false,
  autoGain: false,
  autoEQ: false,
  isTransitioning: false,

  // Setters
  setEnabled: (enabled) => set({ enabled }),
  setMode: (mode) => set({ mode }),
  setTransitionStyle: (transitionStyle) => set({ transitionStyle }),
  setfade_duration_sec: (fade_duration_sec) => set({ fade_duration_sec }),
  setSyncBPM: (syncBPM) => set({ syncBPM }),
  setAutoGain: (autoGain) => set({ autoGain }),
  setAutoEQ: (autoEQ) => set({ autoEQ }),
  setTargetBpm: (target_bpm) => set({ target_bpm }),
  setQueue: (queue) => set({ queue }),
  setIsTransitioning: (isTransitioning) => set({ isTransitioning }),

  // High-Utility Pipeline Helpers
  addTrackToQueue: (track) => set((state) => ({ 
    queue: [...state.queue, track] 
  })),

  removeTrackFromQueue: (trackId) => set((state) => ({ 
    queue: state.queue.filter((t) => t.id !== trackId) 
  })),

  advanceQueue: () => {
    const { queue } = get();
    if (queue.length === 0) return null;
    
    const [current, ...remaining] = queue;
    set({ queue: remaining });
    return current; // Returns the played track in case history logging is needed
  },

  clearQueue: () => set({ queue: [] }),
}));
