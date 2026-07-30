// src-tauri/src/commands/fx.rs
use std::sync::Mutex;
use tauri::State;
use crate::audio::engine::AudioEngine;

#[derive(Debug, Clone)]
pub struct FxParams {
    pub echo_amount: f32,
    pub brake_amount: f32,
    pub slip_enabled: bool,
    pub filter_amount: f32,
}

impl Default for FxParams {
    fn default() -> Self {
        Self {
            echo_amount: 0.0,
            brake_amount: 0.0,
            slip_enabled: false,
            filter_amount: 0.0,
        }
    }
}

#[tauri::command]
pub async fn set_echo_param(
    deck_id: u32, 
    amount: f32, 
    state: State<'_, Mutex<AudioEngine>>
) -> Result<(), String> {
    let mut engine = state.lock().map_err(|_| "Failed to lock AudioEngine channel")?;
    // ⭐ FIXED: Using public engine setter method instead of private fields path
    if engine.set_deck_echo(deck_id, amount) {
        Ok(())
    } else {
        Err(format!("Deck ID {} not found inside registry layout parameters", deck_id))
    }
}

#[tauri::command]
pub async fn set_brake_param(
    deck_id: u32, 
    amount: f32, 
    state: State<'_, Mutex<AudioEngine>>
) -> Result<(), String> {
    let mut engine = state.lock().map_err(|_| "Failed to lock AudioEngine channel")?;
    // ⭐ FIXED: Using public engine setter method
    if engine.set_deck_brake(deck_id, amount) {
        Ok(())
    } else {
        Err(format!("Deck ID {} not found inside registry layout parameters", deck_id))
    }
}

#[tauri::command]
pub async fn set_filter_param(
    deck_id: u32, 
    amount: f32, 
    state: State<'_, Mutex<AudioEngine>>
) -> Result<(), String> {
    let mut engine = state.lock().map_err(|_| "Failed to lock AudioEngine channel")?;
    // ⭐ FIXED: Using public engine setter method
    if engine.set_deck_filter(deck_id, amount) {
        Ok(())
    } else {
        Err(format!("Deck ID {} not found inside registry layout parameters", deck_id))
    }
}

#[tauri::command]
pub async fn toggle_slip_param(
    deck_id: u32, 
    enabled: bool, 
    state: State<'_, Mutex<AudioEngine>>
) -> Result<(), String> {
    let mut engine = state.lock().map_err(|_| "Failed to lock AudioEngine channel")?;
    // ⭐ FIXED: Using public engine setter method
    if engine.set_deck_slip(deck_id, enabled) {
        Ok(())
    } else {
        Err(format!("Deck ID {} not found inside registry layout parameters", deck_id))
    }
}
