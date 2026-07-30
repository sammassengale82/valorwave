import { slipEngine } from "../engine/slipEngine";

export const useSlipEngine = () => {
  const startSlip = (deckId: number) => slipEngine.startSlip(deckId);
  const endSlip = (deckId: number) => slipEngine.endSlip(deckId);
  const triggerRoll = (deckId: number, lengthSec: number) =>
    slipEngine.triggerRoll(deckId, lengthSec);

  return {
    startSlip,
    endSlip,
    triggerRoll,
  };
};
