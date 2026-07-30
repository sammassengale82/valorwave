// src-tauri/src/audio/automix.rs

use serde::{Serialize, Deserialize};
use tauri::{AppHandle, Emitter};


//
// ─────────────────────────────────────────────────────────────
//   TRACK METADATA
// ─────────────────────────────────────────────────────────────
//

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TrackMeta {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub bpm: f32,
    pub key: Option<String>,
    pub duration_sec: f32,
    pub intro_sec: f32,
    pub outro_sec: f32,
    pub energy: f32,
}

//
// ─────────────────────────────────────────────────────────────
//   AUTOMIX SETTINGS (USER CONFIG)
// ─────────────────────────────────────────────────────────────
//

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum AutomixMode {
    Dj,
    Karaoke,
    Smart,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AutomixSettings {
    pub enabled: bool,
    pub fade_duration_sec: f32,
    pub target_bpm: Option<f32>,
    pub queue: Vec<TrackMeta>,
    pub mode: AutomixMode,
    /// Deck number (1, 2, 3, 4) as `u32`
    pub next_deck: Option<u32>,
}

impl Default for AutomixSettings {
    fn default() -> Self {
        Self {
            enabled: false,
            fade_duration_sec: 6.0,
            target_bpm: None,
            queue: Vec::new(),
            mode: AutomixMode::Dj,
            next_deck: None,
        }
    }
}

//
// ─────────────────────────────────────────────────────────────
//   AUTOMIX STATE (ENGINE RUNTIME STATE)
// ─────────────────────────────────────────────────────────────
//

#[allow(dead_code)]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AutomixState {
    pub settings: AutomixSettings,
    pub next_deck: Option<u32>,
}

impl Default for AutomixState {
    fn default() -> Self {
        Self {
            settings: AutomixSettings::default(),
            next_deck: None,
        }
    }
}

//
// ─────────────────────────────────────────────────────────────
//   AUTOMIX ENGINE (LOGIC ONLY)
// ─────────────────────────────────────────────────────────────
//

#[allow(dead_code)]
#[derive(Clone, Debug)]
pub struct AutomixEngine {
    pub settings: AutomixSettings,
    pub next_deck: Option<u32>,
}

impl Default for AutomixEngine {
    fn default() -> Self {
        Self {
            settings: AutomixSettings::default(),
            next_deck: None,
        }
    }
}

impl AutomixEngine {
    //
    // ─────────────────────────────────────────────────────────────
    //   STATE EMISSION (TAURI v2)
    // ─────────────────────────────────────────────────────────────
    //

    pub fn emit_state(&self, app: &AppHandle) {
        let state = AutomixState {
            settings: self.settings.clone(),
            next_deck: self.next_deck,
        };
        let _ = app.emit("automix_state", &state);
    }

    //
    // ─────────────────────────────────────────────────────────────
    //   TRANSITION SCORING
    // ─────────────────────────────────────────────────────────────
    //

    pub fn score_transition(&self, from: &TrackMeta, to: &TrackMeta) -> f32 {
        let bpm_diff = (from.bpm - to.bpm).abs();
        let bpm_score = (1.0 - bpm_diff / 10.0).clamp(0.0, 1.0);

        let energy_diff = (from.energy - to.energy).abs();
        let energy_score = (1.0 - energy_diff / 5.0).clamp(0.0, 1.0);

        let key_score = if from.key == to.key { 1.0 } else { 0.5 };

        bpm_score * 0.5 + energy_score * 0.3 + key_score * 0.2
    }

    //
    // ─────────────────────────────────────────────────────────────
    //   PICK BEST NEXT TRACK
    // ─────────────────────────────────────────────────────────────
    //

    pub fn pick_next(&self, current: &TrackMeta) -> Option<TrackMeta> {
        self.settings
            .queue
            .iter()
            .cloned()
            .max_by(|a, b| {
                self.score_transition(current, a)
                    .partial_cmp(&self.score_transition(current, b))
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
    }

    //
    // ─────────────────────────────────────────────────────────────
    //   PICK NEXT DECK (u32, not DeckId)
    // ─────────────────────────────────────────────────────────────
    //

    pub fn pick_next_deck(&self, current_deck: u32) -> u32 {
        if let Some(nd) = self.settings.next_deck {
            nd
        } else {
            if current_deck == 1 { 2 } else { 1 }
        }
    }

    //
    // ─────────────────────────────────────────────────────────────
    //   INTRO / OUTRO DETECTION (SMART MIX)
    // ─────────────────────────────────────────────────────────────
    //

    pub fn detect_intro_outro(&self, samples: &[f32], sample_rate: u32) -> (f32, f32) {
        let window = sample_rate as usize; // 1 second windows
        let mut intro_sec = 0.0;
        let mut outro_sec = 10.0;

        for (i, chunk) in samples.chunks(window).enumerate() {
            let rms = (chunk.iter().map(|s| s * s).sum::<f32>() / chunk.len() as f32).sqrt();
            if rms > 0.02 {
                intro_sec = i as f32;
                break;
            }
        }

        for (i, chunk) in samples.chunks(window).rev().enumerate() {
            let rms = (chunk.iter().map(|s| s * s).sum::<f32>() / chunk.len() as f32).sqrt();
            if rms > 0.02 {
                outro_sec = i as f32;
                break;
            }
        }

        (intro_sec, outro_sec)
    }
}
