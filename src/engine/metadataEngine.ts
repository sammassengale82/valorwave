// src/engine/metadataEngine.ts
import { invoke } from "@tauri-apps/api/core";

export interface AnalyzedMetadata {
  title?: string;
  artist?: string;
  duration?: number;
  bpm?: number;
  key?: string;
  peaks?: number[];
  albumArt?: string; // base64 PNG
}

class MetadataEngine {
  private cache = new Map<string, AnalyzedMetadata>();

  // -----------------------------
  // MAIN ENTRY POINT
  // -----------------------------
  async analyzeTrack(path: string): Promise<AnalyzedMetadata> {
    // Cached?
    if (this.cache.has(path)) {
      return this.cache.get(path)!;
    }

    // Ask backend to analyze
    const result = await invoke("analyze_track_cmd", { path });

    // Backend returns:
    // {
    //   title: string,
    //   artist: string,
    //   duration: number,
    //   bpm: number,
    //   key: string,
    //   peaks: number[],
    //   album_art: number[] (bytes)
    // }

    const meta: AnalyzedMetadata = {
      title: (result as any).title,
      artist: (result as any).artist,
      duration: (result as any).duration,
      bpm: (result as any).bpm,
      key: (result as any).key,
      peaks: (result as any).peaks,
      albumArt: (result as any).album_art
        ? this.bytesToBase64((result as any).album_art)
        : undefined,
    };

    this.cache.set(path, meta);
    return meta;
  }

  // -----------------------------
  // BPM ONLY
  // -----------------------------
  async detectBPM(path: string): Promise<number | null> {
    const bpm = await invoke("detect_bpm_cmd", { path });
    return bpm as number;
  }

  // -----------------------------
  // KEY ONLY
  // -----------------------------
  async detectKey(path: string): Promise<string | null> {
    const key = await invoke("detect_key_cmd", { path });
    return key as string;
  }

  // -----------------------------
  // PEAKS ONLY
  // -----------------------------
  async generatePeaks(path: string): Promise<number[]> {
    const peaks = await invoke("generate_peaks_cmd", { path });
    return peaks as number[];
  }

  // -----------------------------
  // ALBUM ART ONLY
  // -----------------------------
  async extractAlbumArt(path: string): Promise<string | null> {
    const bytes = await invoke("extract_album_art_cmd", { path });
    if (!bytes) return null;
    return this.bytesToBase64(bytes as number[]);
  }

  // -----------------------------
  // UTIL: bytes → base64 PNG
  // -----------------------------
  private bytesToBase64(bytes: number[]): string {
    const bin = Uint8Array.from(bytes);
    const base64 = btoa(
      bin.reduce((acc, byte) => acc + String.fromCharCode(byte), "")
    );
    return `data:image/png;base64,${base64}`;
  }
}

export const metadataEngine = new MetadataEngine();
