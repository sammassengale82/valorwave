// src-tauri/src/commands/automix.rs

use std::sync::Mutex;
use tauri::{State, AppHandle};

use crate::audio::engine::AudioEngine;
use crate::audio::automix::TrackMeta;

#[tauri::command]
pub fn set_automix_enabled(enabled: bool, state: State<'_, Mutex<AudioEngine>>) {
    if let Ok(mut engine) = state.lock() {
        engine.set_automix_enabled(enabled);
    }
}

#[tauri::command]
pub fn set_automix_target_bpm(bpm: f32, state: State<'_, Mutex<AudioEngine>>) {
    if let Ok(mut engine) = state.lock() {
        engine.set_automix_target_bpm(Some(bpm));
    }
}

#[tauri::command]
pub fn add_automix_track(track: TrackMeta, state: State<'_, Mutex<AudioEngine>>) {
    if let Ok(mut engine) = state.lock() {
        let mut automix = engine.get_automix_state();
        automix.settings.queue.push(track);
        engine.set_automix_next_deck(automix.next_deck);
    }
}

#[tauri::command]
pub fn update_deck_position(
    app: AppHandle,
    deck_id: u32,
    position_sec: f32,
    state: State<'_, Mutex<AudioEngine>>,
) {
    if let Ok(mut engine) = state.lock() {
        // You can use deck_id/position_sec for your own logic if needed,
        // but automix triggering only needs the app handle.
        let _ = deck_id;
        let _ = position_sec;

        engine.maybe_trigger_automix(&app);
    }
}

#[tauri::command]
pub fn set_automix_mode(mode: String, state: State<'_, Mutex<AudioEngine>>) {
    if let Ok(mut engine) = state.lock() {
        engine.set_automix_mode(mode);
    }
}
