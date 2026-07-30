// src-tauri/src/commands/stems.rs
use std::sync::Mutex;
use tauri::State;

use crate::audio::engine::AudioEngine;
use crate::audio::stems::StemGains;

#[tauri::command]
pub fn set_stems_enabled(
    engine: State<'_, Mutex<AudioEngine>>,
    deck_id: u32,
    enabled: bool,
) {
    let mut eng = engine.lock().unwrap();
    eng.set_stems_enabled(deck_id, enabled);
}

#[tauri::command]
pub fn set_stem_gains(
    engine: State<'_, Mutex<AudioEngine>>,
    deck_id: u32,
    gains: StemGains,
) {
    let mut eng = engine.lock().unwrap();
    eng.set_stem_gains(deck_id, gains);
}

// Optional: if you want a Rust-side "load_stems" to match TS invoke("load_stems")
#[tauri::command]
pub fn load_stems(
    engine: State<'_, Mutex<AudioEngine>>,
    deck_id: u32,
    gains: StemGains,
) {
    let mut eng = engine.lock().unwrap();
    eng.set_stems_enabled(deck_id, true);
    eng.set_stem_gains(deck_id, gains);
}
