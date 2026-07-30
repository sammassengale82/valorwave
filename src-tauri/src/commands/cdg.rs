// src-tauri/src/commands/cdg.rs

use std::sync::Mutex;
use tauri::State;
use crate::audio::engine::AudioEngine;
use crate::cdg::frame::CdgFrame;

#[tauri::command]
pub fn cdg_load(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32, data: Vec<u8>) {
    engine.lock().unwrap().load_cdg(deck_id, data);
}

#[tauri::command]
pub fn cdg_start(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32, position: f32) {
    engine.lock().unwrap().start_cdg(deck_id, position);
}

#[tauri::command]
pub fn cdg_seek(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32, position: f32) {
    engine.lock().unwrap().seek_cdg(deck_id, position);
}

#[tauri::command]
pub fn cdg_render(engine: State<'_, Mutex<AudioEngine>>, deck_id: u32, now_ms: f64) -> Vec<u8> {
    engine.lock().unwrap().render_cdg(deck_id, now_ms).unwrap_or_default()
}

#[tauri::command]
pub fn get_cdg_frame(deck_id: u32, engine: State<Mutex<AudioEngine>>) -> Option<CdgFrame> {
    let mut engine = engine.lock().unwrap();

    if let Some(bytes) = engine.render_cdg(deck_id, 0.0) {
        Some(CdgFrame {
            width: 300,
            height: 216,
            pixels: bytes,
        })
    } else {
        None
    }
}

