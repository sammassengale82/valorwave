// src-tauri/src/commands/transport.rs
use tauri::State;
use std::sync::Mutex;
use crate::audio::engine::AudioEngine;

#[tauri::command]
pub fn deck_play_pause(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32) {
    let mut eng = engine.lock().unwrap();
    if eng.is_playing(deck_id) {
        eng.stop(deck_id);
    } else {
        eng.play(deck_id);
    }
}

#[tauri::command]
pub fn deck_cue(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32) {
    let mut eng = engine.lock().unwrap();
    eng.cue(deck_id);
}

#[tauri::command]
pub fn deck_sync(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32) {
    let mut eng = engine.lock().unwrap();
    eng.sync_to_master(deck_id);
}

#[tauri::command]
pub fn deck_delete_hotcue(
    deck_id: u32,
    index: u8,
    engine: State<Mutex<AudioEngine>>,
) {
    engine.lock().unwrap().delete_hotcue(deck_id, index);
}

#[tauri::command]
pub fn deck_trigger_hotcue(
    deck_id: u32,
    index: u8,
    engine: State<Mutex<AudioEngine>>,
) {
    engine.lock().unwrap().trigger_hotcue(deck_id, index);
}

#[tauri::command]
pub fn deck_loop_in(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32) {
    let mut eng = engine.lock().unwrap();
    eng.loop_in(deck_id);
}

#[tauri::command]
pub fn deck_loop_out(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32) {
    let mut eng = engine.lock().unwrap();
    eng.loop_out(deck_id);
}

#[tauri::command]
pub fn deck_auto_loop(
    engine: State<'_, Mutex<AudioEngine>>,
    deck_id: u32,
    beats: u32,
) {
    let mut eng = engine.lock().unwrap();
    eng.auto_loop(deck_id, beats);
}

#[tauri::command]
pub fn deck_beatjump(
    engine: State<'_, Mutex<AudioEngine>>,
    deck_id: u32,
    beats: i32,
) {
    let mut eng = engine.lock().unwrap();
    eng.beatjump(deck_id, beats);
}

#[tauri::command]
pub fn deck_set_hotcue(
    engine: State<'_, Mutex<AudioEngine>>,
    deck_id: u32,
    index: u8,
    color: String,
) {
    let mut eng = engine.lock().unwrap();
    eng.set_hotcue(deck_id, index, color);
}
