import { create } from "zustand";
import { audioEngine } from "../engine/audioEngine"; // Adjust relative path if needed

interface TrackState {
  // Caches binary peak data by file path string keys
  waveformPeaks: Record<string, Float32Array>;
  
  // Asynchronously requests and caches a track's waveform peak buffers
  loadWaveformPeaks: (trackPath: string) => Promise<Float32Array>;
}

export const useTrackState = create<TrackState>((set, get) => ({
  waveformPeaks: {},

  loadWaveformPeaks: async (trackPath: string) => {
    if (!trackPath) return new Float32Array(0);

    // 1. Return immediately if data is already inside memory cache
    const cachedPeaks = get().waveformPeaks[trackPath];
    if (cachedPeaks) return cachedPeaks;

    try {
      // 2. Fetch peak metadata straight from your backend rust channel analyzer
      // If your audioEngine has a specific peaks function, call that instead (e.g., audioEngine.getPeaks)
      const data = await audioEngine.analyzeTrack(trackPath);
      
      // Adapt this depending on what your analyzeTrack return object payload structure looks like
      // Assuming it yields a raw array of numbers or floats:
      const rawPeaks: number[] = (data as any).peaks || [];
      const typedPeaks = new Float32Array(rawPeaks);

      // Save safely down into the global store map record
      set((state) => ({
        waveformPeaks: {
          ...state.waveformPeaks,
          [trackPath]: typedPeaks,
        },
      }));

      return typedPeaks;
    } catch (err) {
      console.error(`Failed to analyze or load peaks for: ${trackPath}`, err);
      return new Float32Array(0);
    }
  },
}));
