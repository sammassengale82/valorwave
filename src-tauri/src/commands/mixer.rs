use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;

use crate::audio::engine::AudioEngine;   // <-- Needed for FX commands

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub enum DeckId {
    A,
    B,
    C,
    D,
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub enum EqBand {
    Low,
    Mid,
    High,
}

#[derive(Default)]
pub struct MixerState {
    pub deck_pitch: [f32; 4],
    pub deck_key_shift: [i8; 4],
    pub deck_key_lock: [bool; 4],
    pub deck_vinyl_mode: [bool; 4],
    pub deck_slip_mode: [bool; 4],
    pub deck_reverse: [bool; 4],
    pub deck_brake: [f32; 4],

    pub deck_gain: [f32; 4],
    pub deck_eq_low: [f32; 4],
    pub deck_eq_mid: [f32; 4],
    pub deck_eq_high: [f32; 4],
    pub deck_filter: [f32; 4],
    pub deck_fader: [f32; 4],

    pub crossfader: f32,

    pub mic_gain: f32,
    pub mic_eq_low: f32,
    pub mic_eq_mid: f32,
    pub mic_eq_high: f32,
    pub mic_echo: f32,
    pub mic_ducking: f32,
}

impl MixerState {
    fn deck_index(deck: DeckId) -> usize {
        match deck {
            DeckId::A => 0,
            DeckId::B => 1,
            DeckId::C => 2,
            DeckId::D => 3,
        }
    }
}

// ---------------------------------------------------------
// MIXER COMMANDS (UI mixer only)
// ---------------------------------------------------------

#[tauri::command]
pub fn set_pitch(state: State<'_, Mutex<MixerState>>, deck: DeckId, value: f32) {
    let mut mixer = state.lock().unwrap();
    let idx = MixerState::deck_index(deck);
    mixer.deck_pitch[idx] = value;
}

#[tauri::command]
pub fn set_key_shift(state: State<'_, Mutex<MixerState>>, deck: DeckId, semitones: i8) {
    let mut mixer = state.lock().unwrap();
    let idx = MixerState::deck_index(deck);
    mixer.deck_key_shift[idx] = semitones;
}

#[tauri::command]
pub fn toggle_key_lock(state: State<'_, Mutex<MixerState>>, deck: DeckId) {
    let mut mixer = state.lock().unwrap();
    let idx = MixerState::deck_index(deck);
    mixer.deck_key_lock[idx] = !mixer.deck_key_lock[idx];
}

#[tauri::command]
pub fn toggle_vinyl_mode(state: State<'_, Mutex<MixerState>>, deck: DeckId) {
    let mut mixer = state.lock().unwrap();
    let idx = MixerState::deck_index(deck);
    mixer.deck_vinyl_mode[idx] = !mixer.deck_vinyl_mode[idx];
}

#[tauri::command]
pub fn toggle_slip_mode(state: State<'_, Mutex<MixerState>>, deck: DeckId) {
    let mut mixer = state.lock().unwrap();
    let idx = MixerState::deck_index(deck);
    mixer.deck_slip_mode[idx] = !mixer.deck_slip_mode[idx];
}

#[tauri::command]
pub fn toggle_reverse(state: State<'_, Mutex<MixerState>>, deck: DeckId) {
    let mut mixer = state.lock().unwrap();
    let idx = MixerState::deck_index(deck);
    mixer.deck_reverse[idx] = !mixer.deck_reverse[idx];
}

#[tauri::command]
pub fn set_brake(state: State<'_, Mutex<MixerState>>, deck: DeckId, amount: f32) {
    let mut mixer = state.lock().unwrap();
    let idx = MixerState::deck_index(deck);
    mixer.deck_brake[idx] = amount;
}

#[tauri::command]
pub fn set_eq(state: State<'_, Mutex<MixerState>>, deck: DeckId, band: EqBand, value: f32) {
    let mut mixer = state.lock().unwrap();
    let idx = MixerState::deck_index(deck);

    match band {
        EqBand::Low => mixer.deck_eq_low[idx] = value,
        EqBand::Mid => mixer.deck_eq_mid[idx] = value,
        EqBand::High => mixer.deck_eq_high[idx] = value,
    }
}

#[tauri::command]
pub fn set_filter(state: State<'_, Mutex<MixerState>>, deck: DeckId, value: f32) {
    let mut mixer = state.lock().unwrap();
    let idx = MixerState::deck_index(deck);
    mixer.deck_filter[idx] = value;
}

#[tauri::command]
pub fn set_gain(state: State<'_, Mutex<MixerState>>, deck: DeckId, value: f32) {
    let mut mixer = state.lock().unwrap();
    let idx = MixerState::deck_index(deck);
    mixer.deck_gain[idx] = value;
}

#[tauri::command]
pub fn set_channel_fader(state: State<'_, Mutex<MixerState>>, deck: DeckId, value: f32) {
    let mut mixer = state.lock().unwrap();
    let idx = MixerState::deck_index(deck);
    mixer.deck_fader[idx] = value;
}

#[tauri::command]
pub fn set_crossfader(state: State<'_, Mutex<MixerState>>, value: f32) {
    let mut mixer = state.lock().unwrap();
    mixer.crossfader = value;
}

#[tauri::command]
pub fn set_mic_gain(state: State<'_, Mutex<MixerState>>, value: f32) {
    let mut mixer = state.lock().unwrap();
    mixer.mic_gain = value;
}

#[tauri::command]
pub fn set_mic_eq(state: State<'_, Mutex<MixerState>>, band: EqBand, value: f32) {
    let mut mixer = state.lock().unwrap();
    match band {
        EqBand::Low => mixer.mic_eq_low = value,
        EqBand::Mid => mixer.mic_eq_mid = value,
        EqBand::High => mixer.mic_eq_high = value,
    }
}

#[tauri::command]
pub fn set_mic_echo(state: State<'_, Mutex<MixerState>>, value: f32) {
    let mut mixer = state.lock().unwrap();
    mixer.mic_echo = value;
}

#[tauri::command]
pub fn set_mic_ducking(state: State<'_, Mutex<MixerState>>, value: f32) {
    let mut mixer = state.lock().unwrap();
    mixer.mic_ducking = value;
}

// ---------------------------------------------------------
// FX COMMANDS (call AudioEngine, not MixerState)
// ---------------------------------------------------------

#[tauri::command]
pub fn set_echo(
    engine: State<'_, Mutex<AudioEngine>>,
    deck_id: u32,
    amount: f32,
) {
    engine.lock().unwrap().set_echo(deck_id, amount);
}

#[tauri::command]
pub fn set_slip(
    engine: State<'_, Mutex<AudioEngine>>,
    deck_id: u32,
    enabled: bool,
) {
    engine.lock().unwrap().set_slip(deck_id, enabled);
}

#[tauri::command]
pub fn set_filter_fx(
    engine: State<'_, Mutex<AudioEngine>>,
    deck_id: u32,
    amount: f32,
) {
    engine.lock().unwrap().set_filter(deck_id, amount);
}

#[tauri::command]
pub fn set_brake_fx(
    engine: State<'_, Mutex<AudioEngine>>,
    deck_id: u32,
    amount: f32,
) {
    engine.lock().unwrap().set_brake(deck_id, amount);
}
