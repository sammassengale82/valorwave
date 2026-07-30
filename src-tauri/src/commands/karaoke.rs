// src-tauri/src/commands/karaoke.rs
use std::sync::Mutex;
use tauri::State;

use crate::audio::engine::AudioEngine;
use crate::karaoke::requests::{SingerProfile, SingerStats};

#[tauri::command]
pub fn get_singer_stats(
    deck_id: u32,
    engine: State<Mutex<AudioEngine>>,
) -> Option<SingerStats> {
    let engine = engine.lock().unwrap();
    engine.requests().get_singer_stats(deck_id)
}

#[tauri::command]
pub fn get_singer_profile(
    id: u32,
    engine: State<Mutex<AudioEngine>>,
) -> Option<SingerProfile> {
    let engine = engine.lock().unwrap();
    engine.requests().get_singer_profile(id)
}

#[tauri::command]
pub fn update_singer_notes(
    id: u32,
    notes: String,
    engine: State<Mutex<AudioEngine>>,
) -> bool {
    let mut engine = engine.lock().unwrap();
    engine.requests_mut().update_singer_notes(id, notes).is_some()
}

#[tauri::command]
pub fn add_favorite_song(
    id: u32,
    song: String,
    engine: State<Mutex<AudioEngine>>,
) -> bool {
    let mut engine = engine.lock().unwrap();
    engine.requests_mut().add_favorite_song(id, song).is_some()
}

#[tauri::command]
pub fn remove_favorite_song(
    id: u32,
    song: String,
    engine: State<Mutex<AudioEngine>>,
) -> bool {
    let mut engine = engine.lock().unwrap();
    engine.requests_mut().remove_favorite_song(id, song).is_some()
}
