// src-tauri/src/commands/requests.rs

use std::sync::Mutex;
use tauri::State;
use crate::audio::engine::AudioEngine;
use crate::karaoke::requests::KaraokeRequest;

#[tauri::command]
pub fn request_add(engine: State<'_, Mutex<AudioEngine>>, name: String, song: String) -> KaraokeRequest{
    engine.lock().unwrap().add_request(name, song)
}

#[tauri::command]
pub fn request_approve(engine: State<'_, Mutex<AudioEngine>>, id: u32) -> Option<KaraokeRequest> {
    engine.lock().unwrap().approve_request(id)
}

#[tauri::command]
pub fn request_decline(engine: State<'_, Mutex<AudioEngine>>, id: u32) {
    engine.lock().unwrap().decline_request(id);
}

#[tauri::command]
pub fn request_list(engine: State<'_, Mutex<AudioEngine>>) -> Vec<KaraokeRequest> {
    engine.lock().unwrap().request_list()
}
