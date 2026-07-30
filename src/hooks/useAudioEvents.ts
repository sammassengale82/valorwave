// src/hooks/useAudioEvents.ts
import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useMixerStore } from "../store/mixerStore";
import { useBeatgridState } from "../state/beatgridState";
import { useAudioEngine } from "./useAudioEngine";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { DeckId } from "../types/DeckId";

export function useAudioEvents() {
  const normalizeDeck = (d: "A" | "B" | "C" | "D"): DeckId => {
    return ({ A: 1, B: 2, C: 3, D: 4 }[d]) as DeckId;
  };

  const engine = useAudioEngine();
  const setBeatgrid = useBeatgridState.getState().setBeatgrid;

  useEffect(() => {
  const win = getCurrentWindow();
  if (win.label !== "main") return;   // <-- ADD THIS

  const unsubs: Array<() => void> = [];

  listen("deck_state", (event) => {
    const payload = event.payload as any;
    const deck = (["A","B","C","D"] as const)[payload.deckId];

    useMixerStore.getState().setDeckPeaks(normalizeDeck(deck), new Float32Array(payload.peaks));

    const progress = payload.duration > 0
      ? payload.position / payload.duration
      : 0;

    useMixerStore.getState().setDeckProgress(normalizeDeck(deck), progress);

    engine.updateStems(
      normalizeDeck(payload.deckId),
      true,
      payload.stems // must be { vocal, drums, bass, other }
    );

  }).then(u => unsubs.push(u));

  listen("deck_beatgrid", (event) => {
    const payload = event.payload as any;
    const deck = (["A","B","C","D"] as const)[payload.deckId];

    useMixerStore.getState().setDeckBeatgrid(normalizeDeck(deck), {
      bpm: payload.bpm,
      first_beat_sec: payload.first_beat_sec,
      beats: payload.beats,
    });

    setBeatgrid (normalizeDeck(payload.deckId), {
      bpm: payload.bpm,
      first_beat_sec: payload.first_beat_sec,
      beats: payload.beats,
      offset: 0,
      tightened: false
    });
  }).then(u => unsubs.push(u));

  return () => unsubs.forEach(u => u());
}, [setBeatgrid, engine]);


  useEffect(() => {
    const unsubs: Array<() => void> = [];

    listen("deck_state", (event) => {
      const payload = event.payload as any;
      const deck = (["A","B","C","D"] as const)[payload.deckId];

      useMixerStore.getState().setDeckPeaks(normalizeDeck(deck), new Float32Array(payload.peaks));

      const progress = payload.duration > 0
        ? payload.position / payload.duration
        : 0;

      useMixerStore.getState().setDeckProgress(normalizeDeck(deck), progress);

      engine.updateStems(
        normalizeDeck(payload.deckId),
        true,
        payload.stems // must be { vocal, drums, bass, other }
      );

    }).then(u => unsubs.push(u));

    listen("deck_beatgrid", (event) => {
      const payload = event.payload as any;
      const deck = (["A","B","C","D"] as const)[payload.deckId];

      useMixerStore.getState().setDeckBeatgrid(normalizeDeck(deck), {
        bpm: payload.bpm,
        first_beat_sec: payload.first_beat_sec,
        beats: payload.beats,
      });

      setBeatgrid(normalizeDeck(payload.deckId), {
        bpm: payload.bpm,
        first_beat_sec: payload.first_beat_sec,
        beats: payload.beats,
        offset: 0,
        tightened: false
      });
    }).then(u => unsubs.push(u));

    return () => unsubs.forEach(u => u());
  }, [setBeatgrid, engine]);
}
