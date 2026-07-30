// src-tauri/src/audio/stems.rs
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StemGains {
    pub vocal: f32,
    pub drums: f32,
    pub bass: f32,
    pub other: f32,
}

impl Default for StemGains {
    fn default() -> Self {
        Self {
            vocal: 1.0,
            drums: 1.0,
            bass: 1.0,
            other: 1.0,
        }
    }
}

#[derive(Clone, Debug, Serialize)]
pub struct StemsState {
    pub enabled: bool,
    pub gains: StemGains,
}

impl Default for StemsState {
    fn default() -> Self {
        Self {
            enabled: false,
            gains: StemGains::default(),
        }
    }
}
