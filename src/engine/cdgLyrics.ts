// src/engine/cdgLyrics.ts

export interface LyricLines {
  prev: string;
  current: string;
  next: string;
}

export function parseCDGLyrics(frame: any): LyricLines {
  // If your backend eventually provides text lines directly,
  // plug them in here. For now, we simulate a simple parser.

  if (!frame || !frame.lyrics) {
    return { prev: "", current: "", next: "" };
  }

  const lines = frame.lyrics as string[];

  const currentIndex = frame.current_lyric_index ?? 0;

  return {
    prev: lines[currentIndex - 1] || "",
    current: lines[currentIndex] || "",
    next: lines[currentIndex + 1] || "",
  };
}
