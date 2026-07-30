import { useEffect } from "react";
import { useAutoMixState } from "../state/autoMixState";
import { automixEngine } from "../engine/automixEngine";

export function useAutoMixEngine() {
  useEffect(() => {
    const { enabled } = useAutoMixState.getState();

    if (enabled) {
      automixEngine.enable();
    } else {
      automixEngine.disable();
    }

    const unsub = useAutoMixState.subscribe((state) => {
      if (state.enabled) {
        automixEngine.enable();
      } else {
        automixEngine.disable();
      }
    });

    return () => {
      unsub();
      automixEngine.disable();
    };
  }, []);
}
