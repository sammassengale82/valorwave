// src/state/showState.ts
import { create } from "zustand";
import { Singer } from "./singerState";

export type Mode = "DJ" | "Karaoke" | "Transition" | "Venue";

export interface Hotcue {
  position_sec: number;
  color: string;
}

export interface DeckState {
  id: number;

  // Transport
  is_playing: boolean;
  position_sec: number;
  duration_sec: number;
  tempo_ratio: number;

  // Track paths
  track_path?: string | null;
  cdg_path?: string | null;

  // Looping
  loop_active: boolean;
  loop_start_sec: number;
  loop_end_sec: number;

  // Slip mode
  slip: boolean;
  slip_position: number;
  slip_mode: boolean;
  slip_base_pos: number;

  // FX
  echo_amount: number;
  brake_amount: number;
  filter_value: number;

  // Master deck
  is_master: boolean;

  // Karaoke
  is_karaoke: boolean;
  karaoke_position: number;
  current_singer_id?: string | number | null;

  // Hotcues
  hotcues: Record<number, Hotcue>;
}

interface ShowState {
  mode: Mode;
  setMode: (m: Mode) => void;

  decks: DeckState[];
  togglePlay: (deckId: number) => void;

  singers: Singer[];
  rotationMode: "karaoke" | "dj";

  setMaster: (deckId: number) => void;
  toggleKaraoke: (deckId: number) => void;
  setTempo: (deckId: number, ratio: number) => void;
  setSlip: (deckId: number, enabled: boolean) => void;
  updateDeckPaths: (
    deckId: number,
    track: string | null,
    cdg: string | null
  ) => void;
  setCurrentSinger: (
    deckId: number,
    singerId: string | number | null
  ) => void;
  setHotcue: (deckId: number, hotcueNumber: number) => void;
}

export const useShowState = create<ShowState>((set) => ({
  mode: "DJ",
  setMode: (m) => set({ mode: m }),

  decks: [
    {
      id: 1,
      is_playing: false,
      position_sec: 0,
      duration_sec: 0,
      tempo_ratio: 1.0,

      track_path: null,
      cdg_path: null,

      loop_active: false,
      loop_start_sec: 0,
      loop_end_sec: 0,

      slip: false,
      slip_position: 0,
      slip_mode: false,
      slip_base_pos: 0,

      echo_amount: 0,
      brake_amount: 0,
      filter_value: 0,

      is_master: false,

      is_karaoke: false,
      karaoke_position: 0,
      current_singer_id: null,

      hotcues: {},
    },
    {
      id: 2,
      is_playing: false,
      position_sec: 0,
      duration_sec: 0,
      tempo_ratio: 1.0,

      track_path: null,
      cdg_path: null,

      loop_active: false,
      loop_start_sec: 0,
      loop_end_sec: 0,

      slip: false,
      slip_position: 0,
      slip_mode: false,
      slip_base_pos: 0,

      echo_amount: 0,
      brake_amount: 0,
      filter_value: 0,

      is_master: false,

      is_karaoke: false,
      karaoke_position: 0,
      current_singer_id: null,

      hotcues: {},
    },
    {
      id: 3,
      is_playing: false,
      position_sec: 0,
      duration_sec: 0,
      tempo_ratio: 1.0,

      track_path: null,
      cdg_path: null,

      loop_active: false,
      loop_start_sec: 0,
      loop_end_sec: 0,

      slip: false,
      slip_position: 0,
      slip_mode: false,
      slip_base_pos: 0,

      echo_amount: 0,
      brake_amount: 0,
      filter_value: 0,

      is_master: false,

      is_karaoke: false,
      karaoke_position: 0,
      current_singer_id: null,

      hotcues: {},
    },
    {
      id: 4,
      is_playing: false,
      position_sec: 0,
      duration_sec: 0,
      tempo_ratio: 1.0,

      track_path: null,
      cdg_path: null,

      loop_active: false,
      loop_start_sec: 0,
      loop_end_sec: 0,

      slip: false,
      slip_position: 0,
      slip_mode: false,
      slip_base_pos: 0,

      echo_amount: 0,
      brake_amount: 0,
      filter_value: 0,

      is_master: false,

      is_karaoke: false,
      karaoke_position: 0,
      current_singer_id: null,

      hotcues: {},
    },
  ],

  singers: [],
  rotationMode: "karaoke",

  togglePlay: (deckId) =>
    set((state) => ({
      decks: state.decks.map((d) =>
        d.id === deckId ? { ...d, is_playing: !d.is_playing } : d
      ),
    })),

  setMaster: (deckId) =>
    set((state) => ({
      decks: state.decks.map((d) => ({
        ...d,
        is_master: d.id === deckId,
      })),
    })),

  toggleKaraoke: (deckId) =>
    set((state) => ({
      decks: state.decks.map((d) =>
        d.id === deckId ? { ...d, is_karaoke: !d.is_karaoke } : d
      ),
    })),

  setTempo: (deckId, ratio) =>
    set((state) => ({
      decks: state.decks.map((d) =>
        d.id === deckId ? { ...d, tempo_ratio: ratio } : d
      ),
    })),

  setSlip: (deckId, enabled) =>
    set((state) => ({
      decks: state.decks.map((d) =>
        d.id === deckId ? { ...d, slip: enabled } : d
      ),
    })),

  updateDeckPaths: (deckId, track, cdg) =>
    set((state) => ({
      decks: state.decks.map((d) =>
        d.id === deckId
          ? {
              ...d,
              track_path: track,
              cdg_path: cdg,
            }
          : d
      ),
    })),

  setCurrentSinger: (deckId, singerId) =>
    set((state) => ({
      decks: state.decks.map((d) =>
        d.id === deckId ? { ...d, current_singer_id: singerId } : d
      ),
    })),

  setHotcue: (deckId, hotcueNumber) =>
    set((state) => {
      const deck = state.decks.find((d) => d.id === deckId);
      if (!deck) return state;

      deck.hotcues = {
        ...deck.hotcues,
        [hotcueNumber]: {
          position_sec: deck.position_sec ?? 0,
          color: "blue",
        },
      };

      return { decks: [...state.decks] };
    }),
}));

export const getShowSerializable = () => {
  const { mode, decks } = useShowState.getState();
  return { mode, decks };
};
