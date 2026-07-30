import { useHotCueState } from "../state/hotCueState";
import { audioEngine } from "../engine/audioEngine";

export const useHotCueEngine = () => {
  const {
    setHotCue,
    deleteHotCue,
    renameHotCue,
    recolorHotCue,
  } = useHotCueState.getState();

  const triggerHotCue = async (deckId: number, id: number) => {
    const cue = useHotCueState
      .getState()
      .cues.find((c) => c.deckId === deckId && c.id === id);

    if (!cue || cue.time === null) return;

    await audioEngine.setPosition(deckId, cue.time);
    await audioEngine.play(deckId);
  };

  const setCue = async (deckId: number, id: number) => {
    const pos = await audioEngine.getPosition(deckId);
    if (typeof pos !== "number") return;
    setHotCue(deckId, id, pos);
  };

  return {
    triggerHotCue,
    setHotCue: setCue,
    deleteHotCue,
    renameHotCue,
    recolorHotCue,
  };
};
