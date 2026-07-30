import { useEffect } from "react";
import { audioEngine } from "../engine/audioEngine";

export type EqBand = "low" | "mid" | "high";

export const useMixerEngine = () => {
  const setChannelGain = (deckId: number, gain: number) => {
    audioEngine.setChannelGain(deckId, gain);
  };

  const setChannelEq = (deckId: number, band: EqBand, value: number) => {
    audioEngine.setChannelEq(deckId, band, value);
  };

  const setCrossfader = (value: number) => {
    audioEngine.setCrossfader(value);
  };

  useEffect(() => {
    const handler = (e: CustomEvent<{ value: number }>) => {
      if (typeof e.detail?.value === "number") {
        audioEngine.setCrossfader(e.detail.value);
      }
    };

    window.addEventListener("mixer:setCrossfader", handler as EventListener);
    return () =>
      window.removeEventListener("mixer:setCrossfader", handler as EventListener);
  }, []);

  return {
    setChannelGain,
    setChannelEq,
    setCrossfader,
  };
};
