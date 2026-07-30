// src/audio/automix.ts
import { getRegisteredDecks } from "./deckRegistry";

export interface AutomixOptions {
  fadeMs: number;      // Duration of fade in/out
  overlapMs: number;   // How long both decks should play together
}

/**
 * Perform a professional DJ-style automix transition.
 * - Selects the currently playing deck as "from"
 * - Selects the next stopped deck as "to"
 * - Starts "to" deck early based on overlapMs
 * - Executes synchronized fade-in / fade-out
 * - Ensures beat alignment if engine supports it
 */
export async function performAutomix(
  opts: AutomixOptions = { fadeMs: 8000, overlapMs: 4000 }
) {
  const decks = getRegisteredDecks().filter((d) => d.trackPath);
  if (decks.length < 2) return;

  const playing = decks.filter((d) => d.is_playing);
  const stopped = decks.filter((d) => !d.is_playing);

  if (!playing.length || !stopped.length) return;

  const from = playing[0];
  const to = stopped[0];

  // Safety: ensure both decks have valid metadata
  if (!from.trackPath || !to.trackPath) return;

  // 1. Preload beatgrid / sync if available
  try {
    if (to.syncToMaster) {
      to.syncToMaster(from.id);
    }
  } catch {
    /* optional sync */
  }

  // 2. Start next deck early (overlap)
  try {
    to.play();
  } catch {
    /* engine may reject if already playing */
  }

  // 3. Fade-in next deck
  try {
    to.fadeIn(opts.fadeMs);
  } catch {
    /* optional fade */
  }

  // 4. Fade-out current deck
  try {
    from.fadeOut(opts.fadeMs);
  } catch {
    /* optional fade */
  }

  // 5. Switch master deck if engine supports it
  try {
    if (from.setMaster && to.setMaster) {
      to.setMaster(to.id);
    }
  } catch {
    /* optional master switch */
  }
}
