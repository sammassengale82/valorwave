import { invoke } from "@tauri-apps/api/core";

export function usePitchDetection() {
  async function detectPitch(samples: Float32Array, sampleRate: number) {
    const arr = Array.from(samples);
    return await invoke<number>("pitch_detect", {
      samples: arr,
      sampleRate,
    });
  }

  return { detectPitch };
}
