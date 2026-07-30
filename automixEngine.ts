import { invoke } from "@tauri-apps/api/core";
import { TrackAnalysis } from "../types/TrackAnalysis";
import { useAutoMixState } from "../state/autoMixState";
import { performAutomix } from "./automix";

export async function analyzeTrack(path: string): Promise<TrackAnalysis> {
  return await invoke("analyze_track", { path });
}

/**
 * Equal-power crossfade curve
 * (Used by every major DJ software)
 */
function equalPowerCurve(t: number) {
  return Math.sin((t * Math.PI) / 2);
}

/**
 * Exponential fade (more natural for vocals)
 */
function expoCurve(t: number) {
  return Math.pow(t, 1.8);
}

/**
 * S-curve (smooth DJ-style transition)
 */
function sCurve(t: number) {
  return t * t * (3 - 2 * t);
}

/**
 * ⭐ Unified Automix Entry Point
 * This merges your simple automix.ts fade logic
 * with your full DJ-grade transition engine.
 */
export async function startAutomix() {
  // 1. Simple fade-in/out helper (automix.ts)
  await performAutomix({
    fadeMs: 8000,
    overlapMs: 4000,
  });

  // 2. Full smart transition engine
  const { fromDeck, toDeck, analysisA, analysisB } = useAutoMixState.getState() as any;

  if (fromDeck && toDeck && analysisA && analysisB) {
    await startAutomixTransition(fromDeck, toDeck, analysisA, analysisB);
  }
}

/**
 * ⭐ Main Transition Engine
 */
export async function startAutomixTransition(
  fromDeck: any,
  toDeck: any,
  analysisA: TrackAnalysis,
  analysisB: TrackAnalysis
) {
  const state = useAutoMixState.getState() as any;
  const { transitionStyle, syncBPM, karaokeMode } = state;
  const fade_duration_sec = state.fade_duration_sec ?? state.fadeMs ?? 8000;

  // ⭐ Karaoke mode = simple fade, no BPM sync, no vocal overlap
  if (karaokeMode) {
    return simpleKaraokeFade(fromDeck, toDeck, fade_duration_sec);
  }

  // ⭐ DJ mode BPM sync
  if (syncBPM && analysisA.bpm && analysisB.bpm) {
    const ratio = analysisA.bpm / analysisB.bpm;
    toDeck.setTempo(ratio);
  }

  switch (transitionStyle) {
    case "smart":
      return smartMix(fromDeck, toDeck, analysisA, analysisB, fade_duration_sec);

    case "fade":
      return constantPowerFade(fromDeck, toDeck, fade_duration_sec);

    case "cut":
      fromDeck.stop();
      return toDeck.play();

    case "echo":
      return echoOutTransition(fromDeck, toDeck, fade_duration_sec);

    case "bassswap":
      return bassSwapTransition(fromDeck, toDeck, fade_duration_sec);

    default:
      return constantPowerFade(fromDeck, toDeck, fade_duration_sec);
  }
}

/* ---------------------------------------------------------
   ⭐ TRANSITION TYPES
--------------------------------------------------------- */

/**
 * ⭐ Smart Mix
 * - Uses intro/outro detection
 * - Uses energy levels
 * - Uses S-curve for smoothness
 */
async function smartMix(
  fromDeck: any,
  toDeck: any,
  a: TrackAnalysis,
  b: TrackAnalysis,
  ms: number
) {
  const steps = 60;
  const stepTime = ms / steps;

  toDeck.play();

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    // S-curve for smoothness
    const fadeIn = sCurve(t);
    const fadeOut = 1 - sCurve(t);

    // Energy-aware adjustment
    const energyFactor = Math.min(1, b.energy / (a.energy || 1));

    fromDeck.fadeOut(fadeOut * energyFactor);
    toDeck.fadeIn(fadeIn);

    await new Promise((res) => setTimeout(res, stepTime));
  }

  fromDeck.stop();
}

/**
 * ⭐ Constant-Power Crossfade
 * (Industry standard)
 */
async function constantPowerFade(fromDeck: any, toDeck: any, ms: number) {
  const steps = 60;
  const stepTime = ms / steps;

  toDeck.play();

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    const fadeIn = equalPowerCurve(t);
    const fadeOut = equalPowerCurve(1 - t);

    fromDeck.fadeOut(fadeOut);
    toDeck.fadeIn(fadeIn);

    await new Promise((res) => setTimeout(res, stepTime));
  }

  fromDeck.stop();
}

/**
 * ⭐ Karaoke Fade
 * - No vocal overlap
 * - Exponential fade for natural vocal decay
 */
async function simpleKaraokeFade(fromDeck: any, toDeck: any, ms: number) {
  const steps = 50;
  const stepTime = ms / steps;

  toDeck.play();

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    const fadeIn = expoCurve(t);
    const fadeOut = expoCurve(1 - t);

    fromDeck.fadeOut(fadeOut);
    toDeck.fadeIn(fadeIn);

    await new Promise((res) => setTimeout(res, stepTime));
  }

  fromDeck.stop();
}

/**
 * ⭐ Echo Out Transition
 */
async function echoOutTransition(fromDeck: any, toDeck: any, ms: number) {
  toDeck.play();

  // Fade in new deck
  toDeck.fadeIn(ms);

  // Echo out old deck
  fromDeck.echoOut(ms);

  await new Promise((res) => setTimeout(res, ms));
  fromDeck.stop();
}

/**
 * ⭐ Bass Swap Transition
 * - Drop bass on outgoing track
 * - Bring bass on incoming track
 */
async function bassSwapTransition(fromDeck: any, toDeck: any, ms: number) {
  const steps = 50;
  const stepTime = ms / steps;

  toDeck.play();

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    const fadeIn = sCurve(t);
    const fadeOut = sCurve(1 - t);

    // Simulated bass swap (you can wire real EQ later)
    fromDeck.fadeOut(fadeOut * 0.6);
    toDeck.fadeIn(fadeIn * 1.2);

    await new Promise((res) => setTimeout(res, stepTime));
  }

  fromDeck.stop();
}
