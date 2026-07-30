// src/store/mixerStore.ts
import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { DeckId } from "../types/DeckId";

export type EqBand = "Low" | "Mid" | "High";

interface DeckBeatgrid {
  bpm: number;
  first_beat_sec: number;
  beats: number[];
}

interface MixerStore {
  // state
  deckPitch: Record<DeckId, number>;
  deckKeyShift: Record<DeckId, number>;
  deckKeyLock: Record<DeckId, boolean>;
  deckVinylMode: Record<DeckId, boolean>;
  deckSlipMode: Record<DeckId, boolean>;
  deckReverse: Record<DeckId, boolean>;
  deckBrake: Record<DeckId, number>;

  deckGain: Record<DeckId, number>;
  deckEqLow: Record<DeckId, number>;
  deckEqMid: Record<DeckId, number>;
  deckEqHigh: Record<DeckId, number>;
  deckFilter: Record<DeckId, number>;
  deckEcho: Record<DeckId, number>;
  deckFader: Record<DeckId, number>;

  crossfader: number;

  micGain: number;
  micEqLow: number;
  micEqMid: number;
  micEqHigh: number;
  micEcho: number;
  micDucking: number;

  deckPeaks: Record<DeckId, Float32Array>;
  deckProgress: Record<DeckId, number>;
  deckBeatgrid: Record<DeckId, DeckBeatgrid | null>;

  automixEnabled: boolean;
  automixFade: number;
  automixTargetBpm: number | null;
  automixNextDeck: DeckId | null;

  // deck commands
  setPitch: (deck: DeckId, value: number) => Promise<void>;
  setKeyShift: (deck: DeckId, semitones: number) => Promise<void>;
  toggleKeyLock: (deck: DeckId) => Promise<void>;
  toggleVinylMode: (deck: DeckId) => Promise<void>;
  toggleSlipMode: (deck: DeckId) => Promise<void>;
  toggleReverse: (deck: DeckId) => Promise<void>;
  // Echo / Brake / Filter
  setEcho: (deck: DeckId, amount: number) => Promise<void>;
  setBrake: (deck: DeckId, amount: number) => Promise<void>;
  setFilter: (deck: DeckId, value: number) => Promise<void>;
  
  setEq: (deck: DeckId, band: EqBand, value: number) => Promise<void>;
  setGain: (deck: DeckId, value: number) => Promise<void>;
  setChannelFader: (deck: DeckId, value: number) => Promise<void>;

  setCrossfader: (value: number) => Promise<void>;

  // mic commands
  setMicGain: (value: number) => Promise<void>;
  setMicEq: (band: EqBand, value: number) => Promise<void>;
  setMicEcho: (value: number) => Promise<void>;
  setMicDucking: (value: number) => Promise<void>;

  // deck state sync
  getDeckPeaks: (deck: DeckId) => Float32Array;
  getDeckBeatgrid: (deck: DeckId) => DeckBeatgrid | null;

  setDeckPeaks: (deck: DeckId, peaks: Float32Array) => void;
  setDeckProgress: (deck: DeckId, progress: number) => void;
  setDeckBeatgrid: (deck: DeckId, grid: DeckBeatgrid) => void;

  // transport helpers used by Deck.tsx
  fadeIn: (deck: DeckId, ms: number) => Promise<void>;
  fadeOut: (deck: DeckId, ms: number) => Promise<void>;
  syncToMaster: (deck: DeckId) => Promise<void>;
  setDeckLoop: (deck: DeckId, beats: number, roll?: boolean) => Promise<void>;
  clearDeckLoop: (deck: DeckId) => Promise<void>;
  beatjump: (deck: DeckId, beats: number) => Promise<void>;

  // automix
  setAutomixEnabled: (value: boolean) => Promise<void>;
  setAutomixFade: (sec: number) => Promise<void>;
  setAutomixTargetBpm: (bpm: number | null) => Promise<void>;
  setAutomixNextDeck: (deck: DeckId | null) => Promise<void>;
  
  // -----------------------------
  // NEW REQUIRED FIELDS
  // -----------------------------

  // Karaoke window
  openKaraokeWindow: () => Promise<void>;
  closeKaraokeWindow: () => Promise<void>;

  // Beatgrid
  setBeatgridFirstBeat: (deck: DeckId, sec: number) => Promise<void>;

  // Slip / Roll
  startSlip: (deck: DeckId) => Promise<void>;
  endSlip: (deck: DeckId) => Promise<void>;
  triggerRoll: (deck: DeckId, seconds: number) => Promise<void>;

  // Karaoke / CDG
  setKaraoke: (deck: DeckId, enabled: boolean) => Promise<void>;
  loadCDG: (deck: DeckId, path: string) => Promise<void>;
  startCDG: (deck: DeckId, pos: number) => Promise<void>;
  seekCDG: (deck: DeckId, pos: number) => Promise<void>;
  setKaraokePosition: (deck: DeckId, pos: number) => Promise<void>;
}

export const useMixerStore = create<MixerStore>((set, get) => ({
  deckPitch: { 1: 0, 2: 0, 3: 0, 4: 0 },
  deckKeyShift: { 1: 0, 2: 0, 3: 0, 4: 0 },
  deckKeyLock: { 1: false, 2: false, 3: false, 4: false },
  deckVinylMode: { 1: false, 2: false, 3: false, 4: false },
  deckSlipMode: { 1: false, 2: false, 3: false, 4: false },
  deckReverse: { 1: false, 2: false, 3: false, 4: false },
  deckBrake: { 1: 0, 2: 0, 3: 0, 4: 0 },

  deckGain: { 1: 1, 2: 1, 3: 1, 4: 1 },
  deckEqLow: { 1: 0, 2: 0, 3: 0, 4: 0 },
  deckEqMid: { 1: 0, 2: 0, 3: 0, 4: 0 },
  deckEqHigh: { 1: 0, 2: 0, 3: 0, 4: 0 },

  deckFilter: { 1: 0, 2: 0, 3: 0, 4: 0 },
  deckEcho: { 1: 0, 2: 0, 3: 0, 4: 0 },

  deckFader: { 1: 1, 2: 1, 3: 1, 4: 1 },

  crossfader: 0.5,

  micGain: 1,
  micEqLow: 0,
  micEqMid: 0,
  micEqHigh: 0,
  micEcho: 0,
  micDucking: 0,

  deckPeaks: {
    1: new Float32Array(),
    2: new Float32Array(),
    3: new Float32Array(),
    4: new Float32Array(),
  },

  deckProgress: { 1: 0, 2: 0, 3: 0, 4: 0 },

  deckBeatgrid: { 1: null, 2: null, 3: null, 4: null },

  automixEnabled: false,
  automixFade: 6,
  automixTargetBpm: null,
  automixNextDeck: null,

  // -----------------------------
  // DECK COMMANDS
  // -----------------------------
  setPitch: async (deck, value) => {
    await invoke("set_pitch", { deck, value });
    set((s) => ({ deckPitch: { ...s.deckPitch, [deck]: value } }));
  },

  setKeyShift: async (deck, semitones) => {
    await invoke("set_key_shift", { deck, semitones });
    set((s) => ({ deckKeyShift: { ...s.deckKeyShift, [deck]: semitones } }));
  },

  toggleKeyLock: async (deck) => {
    await invoke("toggle_key_lock", { deck });
    set((s) => ({
      deckKeyLock: { ...s.deckKeyLock, [deck]: !s.deckKeyLock[deck] },
    }));
  },

  toggleVinylMode: async (deck) => {
    await invoke("toggle_vinyl_mode", { deck });
    set((s) => ({
      deckVinylMode: { ...s.deckVinylMode, [deck]: !s.deckVinylMode[deck] },
    }));
  },

  toggleSlipMode: async (deck) => {
    await invoke("set_slip", {
      deckId: deck,
      enabled: !get().deckSlipMode[deck],
    });

    set((s) => ({
      deckSlipMode: { ...s.deckSlipMode, [deck]: !s.deckSlipMode[deck] },
    }));
  },

  toggleReverse: async (deck) => {
    await invoke("toggle_reverse", { deck });
    set((s) => ({
      deckReverse: { ...s.deckReverse, [deck]: !s.deckReverse[deck] },
    }));
  },

  // -----------------------------
  // Echo / Brake / Filter (Deck.tsx uses setEcho, setBrake, setFilter)
  // -----------------------------
  setEcho: async (deck: DeckId, amount: number) => {
    await invoke("set_echo", { deckId: deck, amount });
    set((s) => ({ deckEcho: { ...s.deckEcho, [deck]: amount } }));
  },

  setBrake: async (deck: DeckId, amount: number) => {
    await invoke("set_brake", { deckId: deck, amount });
    set((s) => ({ deckBrake: { ...s.deckBrake, [deck]: amount } }));
  },

  setFilter: async (deck: DeckId, value: number) => {
    await invoke("set_filter", { deckId: deck, value });
    set((s) => ({ deckFilter: { ...s.deckFilter, [deck]: value } }));
  },

  setEq: async (deck, band, value) => {
    await invoke("set_eq", { deck, band, value });

    const key =
      band === "Low"
        ? "deckEqLow"
        : band === "Mid"
        ? "deckEqMid"
        : "deckEqHigh";

    set((s) => ({
      [key]: { ...(s as any)[key], [deck]: value },
    }));
  },
  
  setGain: async (deck, value) => {
    await invoke("set_gain", { deck, value });
    set((s) => ({ deckGain: { ...s.deckGain, [deck]: value } }));
  },

  setChannelFader: async (deck, value) => {
    await invoke("set_channel_fader", { deck, value });
    set((s) => ({ deckFader: { ...s.deckFader, [deck]: value } }));
  },

  setCrossfader: async (value) => {
    await invoke("set_crossfader", { value });
    set(() => ({ crossfader: value }));
  },

  // -----------------------------
  // MIC COMMANDS
  // -----------------------------
  setMicGain: async (value) => {
    await invoke("set_mic_gain", { value });
    set(() => ({ micGain: value }));
  },

  setMicEq: async (band, value) => {
    await invoke("set_mic_eq", { band, value });

    const key =
      band === "Low"
        ? "micEqLow"
        : band === "Mid"
        ? "micEqMid"
        : "micEqHigh";

    set(() => ({ [key]: value } as any));
  },

  setMicEcho: async (value) => {
    await invoke("set_mic_echo", { value });
    set(() => ({ micEcho: value }));
  },

  setMicDucking: async (value) => {
    await invoke("set_mic_ducking", { value });
    set(() => ({ micDucking: value }));
  },

  // -----------------------------
  // DECK STATE SYNC
  // -----------------------------
  getDeckPeaks: (deck: DeckId) => get().deckPeaks[deck],
  getDeckBeatgrid: (deck: DeckId) => get().deckBeatgrid[deck],

  setDeckPeaks: (deck, peaks) =>
    set((s) => ({ deckPeaks: { ...s.deckPeaks, [deck]: peaks } })),

  setDeckProgress: (deck, progress) =>
    set((s) => ({ deckProgress: { ...s.deckProgress, [deck]: progress } })),

  setDeckBeatgrid: (deck, grid) =>
    set((s) => ({ deckBeatgrid: { ...s.deckBeatgrid, [deck]: grid } })),

  // -----------------------------
  // Transport helpers used by Deck.tsx
  // -----------------------------
  fadeIn: async (deck, ms) => {
    await invoke("deck_fade_in", { deckId: deck, ms });
  },

  fadeOut: async (deck, ms) => {
    await invoke("deck_fade_out", { deckId: deck, ms });
  },

  syncToMaster: async (deck) => {
    await invoke("deck_sync", { deckId: deck });
  },

  setDeckLoop: async (deck, beats, roll) => {
    await invoke("deck_auto_loop", { deckId: deck, beats, roll });
  },

  clearDeckLoop: async (deck) => {
    await invoke("deck_exit_loop", { deckId: deck });
  },

  beatjump: async (deck, beats) => {
    await invoke("deck_beatjump", { deckId: deck, beats });
  },

  // -----------------------------
  // AutoMix Commands
  // -----------------------------
  setAutomixEnabled: async (value: boolean) => {
    await invoke("set_automix_enabled", { enabled: value });
    set(() => ({ automixEnabled: value }));
  },

  setAutomixFade: async (sec: number) => {
    await invoke("set_automix_fade", { sec });
    set(() => ({ automixFade: sec }));
  },

  setAutomixTargetBpm: async (bpm: number | null) => {
    await invoke("set_automix_target_bpm", { bpm });
    set(() => ({ automixTargetBpm: bpm }));
  },

  setAutomixNextDeck: async (deck: DeckId | null) => {
    await invoke("set_automix_next_deck", {
      deckId: deck ? deck - 1 : null,
    });
    set(() => ({ automixNextDeck: deck }));
  },

  // -----------------------------
// Karaoke Window Control
// -----------------------------
openKaraokeWindow: async () => {
  await invoke("open_karaoke_window");
},

closeKaraokeWindow: async () => {
  await invoke("close_karaoke_window");
},

// -----------------------------
// Beatgrid First Beat
// -----------------------------
setBeatgridFirstBeat: async (deck: DeckId, sec: number) => {
  await invoke("set_beatgrid", {
    deckId: deck,
    first_beat_sec: sec,
  });
},

// -----------------------------
// Slip Engine (Deck.tsx uses startSlip / endSlip / triggerRoll)
// -----------------------------
startSlip: async (deck: DeckId) => {
  await invoke("deck_slip_start", { deckId: deck });
},

endSlip: async (deck: DeckId) => {
  await invoke("deck_slip_end", { deckId: deck });
},

triggerRoll: async (deck: DeckId, seconds: number) => {
  await invoke("deck_roll", { deckId: deck, seconds });
},

// -----------------------------
// Karaoke / CDG Control
// -----------------------------
setKaraoke: async (deck: DeckId, enabled: boolean) => {
  await invoke("set_karaoke", { deckId: deck, enabled });
},

loadCDG: async (deck: DeckId, path: string) => {
  await invoke("deck_load_cdg", { deckId: deck, path });
},

startCDG: async (deck: DeckId, pos: number) => {
  await invoke("deck_start_cdg", { deckId: deck, pos });
},

seekCDG: async (deck: DeckId, pos: number) => {
  await invoke("deck_seek_cdg", { deckId: deck, pos });
},

setKaraokePosition: async (deck: DeckId, pos: number) => {
  await invoke("set_karaoke_position", { deckId: deck, pos });
},

}));

