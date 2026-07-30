// src/engine/automixEngine.ts
import { audioEngine } from "./audioEngine";
import { useAutoMixState } from "../state/autoMixState";
import "../styles/automixpanel.css";

export interface TrackAnalysis {
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

/* =========================================================================
   1. DJ PERFORMANCE MATHEMATICAL ATTENUATORS
   ========================================================================= */

/** Industry-Standard Equal-Power Crossfade Curve */
function equalPowerCurve(t: number) {
  return Math.sin((t * Math.PI) / 2);
}

/** Exponential Fade (Ideal for natural microphone and karaoke vocal decay) */
function expoCurve(t: number) {
  return Math.pow(t, 1.8);
}

/** Smooth DJ S-Curve Profile */
function sCurve(t: number) {
  return t * t * (3 - 2 * t);
}

/* =========================================================================
   2. MAIN CORE AUTOMATION LOOPS
   ========================================================================= */

class AutomixEngine {
  private enabled = false;
  private currentDeck = 1;
  private nextDeck = 2;
  private isTransitioning = false;
  private rafId: number | null = null;

  /** Initializes background automation clock checks */
  public enable() {
    if (this.enabled) return;
    this.enabled = true;
    
    useAutoMixState.getState().setEnabled(true);
    this.monitorLoop();
  }

  /** Terminate tracking loops instantly */
  public disable() {
    this.enabled = false;
    useAutoMixState.getState().setEnabled(false);
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * The Real-time Engine Heartbeat:
   * Continuously scans playback metrics on frame ticks to detect upcoming song boundaries
   */
  private monitorLoop = async () => {
    if (!this.enabled) return;

    if (!this.isTransitioning) {
      const duration = Number(audioEngine.getDuration(this.currentDeck));
      const pos = Number(await audioEngine.getPosition(this.currentDeck));
      
      const state = useAutoMixState.getState();
      const fadeDurationSec = (state.fade_duration_sec ?? 6000) / 1000;

      if (Number.isFinite(duration) && Number.isFinite(pos) && duration > 0) {
        if (duration - pos <= fadeDurationSec) {
          this.startAutomixTransition();
        }
      }
    }

    this.rafId = requestAnimationFrame(this.monitorLoop);
  };

  /**
   * Evaluates track sync relationships and executes corresponding channel shifts
   */
  private async startAutomixTransition() {
    this.isTransitioning = true;
    useAutoMixState.getState().setIsTransitioning(true);

    const state = useAutoMixState.getState();
    const { transitionStyle, syncBPM, mode } = state;
    const fadeDurationMs = state.fade_duration_sec ?? 6000;

    const queue = state.queue;
    const currentTrack = queue[0] as TrackAnalysis | undefined;
    const nextTrack = queue[1] as TrackAnalysis | undefined;

    const isKaraokeMode = mode === "karaoke";

    if (!isKaraokeMode && syncBPM && currentTrack?.bpm && nextTrack?.bpm) {
      const ratio = currentTrack.bpm / nextTrack.bpm;
      // ⭐ FIXED: Changed setTempo_cmd to your actual public setTempo method
      await audioEngine.setTempo(this.nextDeck, ratio);
    }

    // ⭐ FIXED: Changed play_cmd to play
    await audioEngine.play(this.nextDeck);

    if (isKaraokeMode) {
      await this.simpleKaraokeFade(fadeDurationMs);
    } else {
      switch (transitionStyle) {
        case "smart":
          await this.smartMix(currentTrack, nextTrack, fadeDurationMs);
          break;
        case "fade":
          await this.constantPowerFade(fadeDurationMs);
          break;
        case "cut":
          // ⭐ FIXED: Changed stop_cmd to stop
          await audioEngine.stop(this.currentDeck);
          this.completeTransition();
          break;
        case "echo":
          await this.echoOutTransition(fadeDurationMs);
          break;
        default:
          await this.constantPowerFade(fadeDurationMs);
          break;
      }
    }
  }

  /* =========================================================================
     3. MIXING EXECUTION STRATEGIES (FADING ARCHITECTURE)
     ========================================================================= */

  /** Smart EQ & Energy Blending via Crossfader updates */
  private async smartMix(a: TrackAnalysis | undefined, b: TrackAnalysis | undefined, ms: number) {
    const steps = 60;
    const stepTime = ms / steps;
    
    for (let i = 0; i <= steps; i++) {
      if (!this.enabled) return;
      const t = i / steps;

      // Map progress directly onto your physical mixer's horizontal crossfader position
      // 0.0 = completely Deck 1, 1.0 = completely Deck 2
      // Using an S-Curve provides optimal center blend transparency
      const crossfaderValue = sCurve(t); 
      
      // ⭐ FIXED: Forwarding crossfader position down to your system mixer context.
      // If your audioEngine uses a different property name for faders (like setCrossfader), 
      // replace setCrossfaderPosition with that exact handler.
      if ((audioEngine as any).setCrossfaderPosition) {
        await (audioEngine as any).setCrossfaderPosition(crossfaderValue);
      } else {
        // Fallback option: update via the global window routing custom event
        window.dispatchEvent(
          new CustomEvent("mixer:setCrossfader", { detail: { value: crossfaderValue } })
        );
      }

      this.updateGlobalProgressHUD(t * 100);
      await new Promise((res) => setTimeout(res, stepTime));
    }
    this.completeTransition();
  }

  /** Industry-Standard Constant Power Crossfade Blender */
  private async constantPowerFade(ms: number) {
    const steps = 60;
    const stepTime = ms / steps;

    for (let i = 0; i <= steps; i++) {
      if (!this.enabled) return;
      const t = i / steps;

      // Equal-power mathematical positioning prevents drop-out dip in the middle
      const crossfaderValue = equalPowerCurve(t);

      if ((audioEngine as any).setCrossfaderPosition) {
        await (audioEngine as any).setCrossfaderPosition(crossfaderValue);
      } else {
        window.dispatchEvent(
          new CustomEvent("mixer:setCrossfader", { detail: { value: crossfaderValue } })
        );
      }

      this.updateGlobalProgressHUD(t * 100);
      await new Promise((res) => setTimeout(res, stepTime));
    }
    this.completeTransition();
  }

  /** Smooth Karaoke Decay - Prevents vocal collision clashes */
  private async simpleKaraokeFade(ms: number) {
    const steps = 50;
    const stepTime = ms / steps;

    for (let i = 0; i <= steps; i++) {
      if (!this.enabled) return;
      const t = i / steps;

      const crossfaderValue = expoCurve(t);

      if ((audioEngine as any).setCrossfaderPosition) {
        await (audioEngine as any).setCrossfaderPosition(crossfaderValue);
      } else {
        window.dispatchEvent(
          new CustomEvent("mixer:setCrossfader", { detail: { value: crossfaderValue } })
        );
      }

      this.updateGlobalProgressHUD(t * 100);
      await new Promise((res) => setTimeout(res, stepTime));
    }
    this.completeTransition();
  }

  /** Automated Delay Tail Out */
  private async echoOutTransition(ms: number) {
    // ⭐ FIXED: Safely checking if a public FX method exists on audioEngine
    if ((audioEngine as any).setEchoAmount) {
      await (audioEngine as any).setEchoAmount(this.currentDeck, 0.8);
    }
    await this.constantPowerFade(ms);
  }

  /** Closes out the current mix window and cycles the queue indices */
  private async completeTransition() {
    // ⭐ FIXED: Changed stop_cmd to stop
    await audioEngine.stop(this.currentDeck);
    
    // Cycle the active playback deck pointers
    const temp = this.currentDeck;
    this.currentDeck = this.nextDeck;
    this.nextDeck = temp;

    this.isTransitioning = false;
    
    // Force crossfader position reset back to absolute zero for the new primary deck
    if ((audioEngine as any).setCrossfaderPosition) {
      await (audioEngine as any).setCrossfaderPosition(0.0);
    } else {
      window.dispatchEvent(
        new CustomEvent("mixer:setCrossfader", { detail: { value: 0.0 } })
      );
    }
    
    const state = useAutoMixState.getState();
    state.setIsTransitioning(false);
    if (state.advanceQueue) {
      state.advanceQueue();
    }
    this.updateGlobalProgressHUD(0);
  }

  /** Dispatches progress values straight to window global telemetry fields */
  private updateGlobalProgressHUD(percent: number) {
    window.dispatchEvent(
      new CustomEvent("automix:transition-progress", { detail: { progress: percent } })
    );
  }
}

export const automixEngine = new AutomixEngine();

