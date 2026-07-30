// src/hooks/useAutomix.ts
import { useEffect, useState } from "react";
import { useAutoMixState } from "../state/autoMixState";
import { automixEngine } from "../engine/automixEngine";

export const useAutomix = () => {
  // 1. Subscribe to the centralized global Automix state manager values
  const enabled = useAutoMixState((s) => s.enabled);
  const mode = useAutoMixState((s) => s.mode);
  const transitionStyle = useAutoMixState((s) => s.transitionStyle);
  const fadeDurationMs = useAutoMixState((s) => s.fade_duration_sec);
  
  // Local interface tracking states for transition HUD rendering fallback dispatches
  const [liveProgress, setLiveProgress] = useState<number>(0);

  // 2. Continuous Event Telemetry Listeners
  useEffect(() => {
    // Listens to the high-density frame events emitted by the background loop thread
    const handleTransitionProgress = (e: Event) => {
      const customEvent = e as CustomEvent<{ progress: number }>;
      setLiveProgress(customEvent.detail.progress);
    };

    window.addEventListener("automix:transition-progress", handleTransitionProgress);
    return () => {
      window.removeEventListener("automix:transition-progress", handleTransitionProgress);
    };
  }, []);

  // 3. Pro-Performance Execution Wrappers
  const start = () => {
    // Instantly fires up the background monitoring loop engine safely
    automixEngine.enable();
  };

  const stop = () => {
    // Instantly terminates ticking frames and stops double crossfader calls
    automixEngine.disable();
    setLiveProgress(0);
  };

  // Helper setter adjustments to modify core values
  const setTransitionStyle = (style: any) => {
    useAutoMixState.getState().setTransitionStyle(style);
  };

  const setFadeDuration = (durationMs: number) => {
    useAutoMixState.getState().setfade_duration_sec(durationMs);
  };

  return {
    enabled,
    liveProgress,
    mode,
    transitionStyle,
    fadeDurationMs,
    setTransitionStyle,
    setFadeDuration,
    start,
    stop,
  };
};
