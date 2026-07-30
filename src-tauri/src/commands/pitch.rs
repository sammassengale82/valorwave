use std::sync::Mutex;
use tauri::State;

use crate::audio::engine::AudioEngine;

#[tauri::command]
pub fn pitch_detect(
    engine: State<'_, Mutex<AudioEngine>>,
    samples: Vec<f32>,
    sample_rate: usize,
) -> f32 {
    engine.lock().unwrap().detect_pitch(samples, sample_rate)
}
