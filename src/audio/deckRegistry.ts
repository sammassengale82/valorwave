// src/audio/deckRegistry.ts

export type DeckId = 1 | 2 | 3 | 4;

export interface RegisteredDeck {
  id: DeckId;
  track_path: string | null;
  is_playing: boolean;
  timeRemainingMs: number;

  play: () => void;
  stop: () => void;

  fadeIn?: (ms: number) => void;
  fadeOut?: (ms: number) => void;

  setTempo?: (ratio: number) => void;
  smartFadeIn?: (fromDeck: DeckId, toDeck: DeckId, ms: number) => void;
  smartFadeOut?: (fromDeck: DeckId, toDeck: DeckId, ms: number) => void;
  echoOut?: (ms: number) => void;
}

// Global registry map for all decks
const registry = new Map<DeckId, RegisteredDeck>();

// Legacy direct references (if you still want quick access)
let deck1: RegisteredDeck | null = null;
let deck2: RegisteredDeck | null = null;
let deck3: RegisteredDeck | null = null;
let deck4: RegisteredDeck | null = null;

/**
 * Register a deck object so the automix engine and other
 * non‑React modules can access it safely.
 */
export function registerDeck(deckNumber: DeckId, deckObj: RegisteredDeck): void {
  registry.set(deckNumber, deckObj);

  switch (deckNumber) {
    case 1:
      deck1 = deckObj;
      break;
    case 2:
      deck2 = deckObj;
      break;
    case 3:
      deck3 = deckObj;
      break;
    case 4:
      deck4 = deckObj;
      break;
    default:
      console.warn("Invalid deck number:", deckNumber);
  }
}

/**
 * Individual accessors (if needed by legacy code)
 */
export function getDeck1(): RegisteredDeck | null {
  return deck1;
}

export function getDeck2(): RegisteredDeck | null {
  return deck2;
}

export function getDeck3(): RegisteredDeck | null {
  return deck3;
}

export function getDeck4(): RegisteredDeck | null {
  return deck4;
}

/**
 * Main accessor used by the automix engine.
 */
export function getRegisteredDecks(): RegisteredDeck[] {
  return Array.from(registry.values());
}
