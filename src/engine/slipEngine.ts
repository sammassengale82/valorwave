// src/engine/slipEngine.ts
import { audioEngine } from "./audioEngine";

class SlipEngine {
  private slipStartPos = new Map<number, number>();
  private slipActive = new Map<number, boolean>();

  async startSlip(deckId: number) {
    const pos = await audioEngine.getPosition(deckId);
    this.slipStartPos.set(deckId, pos as number);
    this.slipActive.set(deckId, true);
  }

  async endSlip(deckId: number) {
    const active = this.slipActive.get(deckId);
    if (!active) return;

    const startPos = this.slipStartPos.get(deckId);
    if (startPos == null) return;

    await audioEngine.setPosition(deckId, startPos);
    this.slipActive.set(deckId, false);
  }

  async triggerRoll(deckId: number, lengthSec: number) {
    const pos = (await audioEngine.getPosition(deckId)) as number;
    const start = Math.max(0, pos - lengthSec);

    await audioEngine.setPosition(deckId, start);
    await audioEngine.play(deckId);

    setTimeout(async () => {
      await audioEngine.setPosition(deckId, pos);
    }, lengthSec * 1000);
  }
}

export const slipEngine = new SlipEngine();
