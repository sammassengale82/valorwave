// src/state/deckState.ts

export interface Hotcue {
  position_sec: number;
  color: string;
}

export interface DeckState {
  id: number;

  // Rust transport fields
  is_playing: boolean;
  position_sec: number;
  duration_sec: number;
  tempo_ratio: number;
  position: number;

  // Track paths
  track_path?: string;
  cdg_path?: string;

  // Looping
  loop_active: boolean;
  loop_start_sec: number;
  loop_end_sec: number;

  // Slip mode
  slip: boolean;
  slip_mode: boolean;
  slip_base_pos: number;

  // FX
  echo_amount: number;
  brake_amount: number;
  filter_value: number;

  // Master deck
  is_master: boolean;

  // Hotcues
  hotcues: Record<number, Hotcue>;

  // --- Extended frontend-only fields ---
  is_karaoke?: boolean;
  karaoke_position?: number;
  current_singer_id?: number | string | null;
}
