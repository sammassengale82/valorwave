import { useEffect } from "react";
import { useAutoDJState } from "../state/autoDJState";
import { useSingerState } from "../state/singerState";
import { audioEngine } from "../engine/audioEngine";

export function useAutoDJEngine() {
  const enabled = useAutoDJState((s) => s.enabled);
  const activeSinger = useSingerState((s) => s.activeSinger);

  const { playBackgroundMusic, stopBackgroundMusic } = audioEngine as any;

  useEffect(() => {
    if (!enabled) {
      if (stopBackgroundMusic) stopBackgroundMusic();
      return;
    }

    if (!activeSinger) {
      if (playBackgroundMusic) playBackgroundMusic();
    } else {
      if (stopBackgroundMusic) stopBackgroundMusic();
    }
  }, [enabled, activeSinger]);
}
