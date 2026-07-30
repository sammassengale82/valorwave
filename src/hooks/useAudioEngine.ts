// src/hooks/useAudioEngine.ts
import { useEffect, useRef } from "react";
import { audioEngine } from "../engine/audioEngine";
import { listen } from "@tauri-apps/api/event";
import { useMixerStore } from "../store/mixerStore";
import { usePitchDetection } from "./usePitchDetection";
import { WebviewWindow } from "@tauri-apps/api/webviewwindow";
import { DeckId } from "../types/DeckId";
export function useAudioEngine() {
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const { detectPitch } = usePitchDetection();

 // Deck + beatgrid events (only on main window)
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    const win = WebviewWindow.getByLabel("main");
    if (!win) return;

    // deck_state
    listen("deck_state", (event) => {
      const payload = event.payload as any;

      const numericId: number = Number(payload.deckId);
      const deck = numericId as DeckId;

      // peaks
      if (payload.peaks) {
        useMixerStore
          .getState()
          .setDeckPeaks(deck, new Float32Array(payload.peaks));
      }

      // progress
      const duration = Number(payload.duration) || 0;
      const position = Number(payload.position) || 0;
      const progress = duration > 0 ? position / duration : 0;
      useMixerStore.getState().setDeckProgress(deck, progress);

      // keep stems in sync with deck playback
      audioEngine.updateStems(numericId, true, {
        vocal: 1,
        drums: 1,
        bass: 1,
        other: 1,
      });
    }).then((unsub) => unsubs.push(unsub));

    // deck_beatgrid
    listen("deck_beatgrid", (event) => {
      const payload = event.payload as any;

      const numericId: number = Number(payload.deckId);
      const deck = numericId as DeckId;

      useMixerStore.getState().setDeckBeatgrid(deck, {
        bpm: payload.bpm,
        first_beat_sec: payload.first_beat_sec,
        beats: payload.beats,
      });
    }).then((unsub) => unsubs.push(unsub));

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Mic analyser for pitch detection / visuals
  useEffect(() => {
    const ctx = new AudioContext();

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        src.connect(analyser);
        micAnalyserRef.current = analyser;
      })
      .catch((err) => console.warn("Mic unavailable:", err));
  }, []);

  // CDG preview loop
  useEffect(() => {
    let running = true;

    async function tick() {
      if (!running) return;

      for (const deckId of [1, 2, 3, 4]) {
        const frame = (await audioEngine.getCDGFrame(deckId)) as
          | null
          | {
              pixels: ArrayBuffer | ArrayBufferView | number[];
              width: number;
              height: number;
            };

        if (!frame) continue;

        const canvas = document.getElementById(
          `cdg-preview-${deckId}`
        ) as HTMLCanvasElement | null;
        if (!canvas) continue;

        const g = canvas.getContext("2d");
        if (!g) continue;

        const pixels =
          frame.pixels instanceof ArrayBuffer
            ? new Uint8ClampedArray(frame.pixels as ArrayBuffer)
            : ArrayBuffer.isView(frame.pixels)
            ? new Uint8ClampedArray(
                (frame.pixels as ArrayBufferView).buffer
              )
            : Uint8ClampedArray.from(frame.pixels as number[]);

        const img = new ImageData(
          Uint8ClampedArray.from(pixels as Iterable<number>),
          frame.width,
          frame.height
        );
        g.putImageData(img, 0, 0);
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);

    return () => {
      running = false;
    };
  }, []);

  return audioEngine;
}
