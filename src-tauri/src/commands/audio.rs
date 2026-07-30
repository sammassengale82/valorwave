use serde::Serialize;
use crate::audio::engine::get_latency;
use tauri::State;
use std::sync::Mutex;

use crate::audio::engine::AudioEngine; // your existing engine

#[derive(Serialize)]
pub struct LatencyResponse {
    pub ms: u32,
}

#[tauri::command]
pub fn get_output_devices() -> Vec<String> {
    vec![
        "Default Device".into(),
        "HDMI Output".into(),
        "USB Audio Interface".into(),
    ]
}

#[tauri::command]
pub fn get_audio_latency() -> LatencyResponse {
    let l = get_latency();
    LatencyResponse { ms: l.ms }
}

#[tauri::command]
pub fn load_track_cmd(
    engine: State<'_, Mutex<AudioEngine>>,
    deck_id: u32,
    path: String,
    cdg_path: Option<String>,
) {
    let mut eng = engine.lock().unwrap();
    eng.load_track(deck_id, &path, cdg_path.as_deref());
}

#[tauri::command]
pub fn play_cmd(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32) {
    let mut eng = engine.lock().unwrap();
    eng.play(deck_id);
}

#[tauri::command]
pub fn stop_cmd(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32) {
    let mut eng = engine.lock().unwrap();
    eng.stop(deck_id);
}

#[tauri::command]
pub fn set_tempo_cmd(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32, ratio: f32) {
    let mut eng = engine.lock().unwrap();
    eng.set_tempo(deck_id, ratio);
}

#[tauri::command]
pub fn set_loop_cmd(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32, beats: u32, roll: bool) {
    let mut eng = engine.lock().unwrap();
    eng.set_loop(deck_id, beats, roll);
}

#[tauri::command]
pub fn clear_loop_cmd(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32) {
    let mut eng = engine.lock().unwrap();
    eng.clear_loop(deck_id);
}

#[tauri::command]
pub fn beatjump_cmd(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32, beats: i32) {
    let mut eng = engine.lock().unwrap();
    eng.beatjump(deck_id, beats);
}

#[tauri::command]
pub fn get_position_cmd(state: State<'_, Mutex<AudioEngine>>, deck_id: u32) -> f32 {
    let engine = state.lock().unwrap();
    engine.get_position_cmd(deck_id)
}

#[tauri::command]
pub fn set_position_cmd(state: State<'_, Mutex<AudioEngine>>, deck_id: u32, position: f32) {
    let mut engine = state.lock().unwrap();
    // Assuming you have or will add a set_position method in engine.rs
    engine.set_position_cmd(deck_id, position); 
}
