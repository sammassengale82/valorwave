import { midiEngine } from "../engine/midiEngine";

export const useMidiEngine = () => {
  const initMidi = () => midiEngine.init();

  return {
    initMidi,
  };
};
