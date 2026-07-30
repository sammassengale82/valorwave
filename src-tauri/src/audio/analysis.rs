use serde::{Serialize, Deserialize};
use std::fs;


/// This must match your TS TrackAnalysis type
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TrackAnalysis {
    pub bpm: f32,
    pub key: String,
    pub energy: f32,
    pub intro_ms: u32,
    pub outro_ms: u32,
    pub vocal_start_ms: u32,
    pub vocal_end_ms: u32,
    pub lufs: f32,
}

fn fake_bpm_from_filename(path: &str) -> f32 {
  // crude heuristic: look for "bpm" in filename, otherwise default
  let lower = path.to_lowercase();
  if let Some(idx) = lower.find("bpm") {
      // try to parse digits before "bpm"
      let slice = &lower[..idx];
      let digits: String = slice.chars().rev().take_while(|c| c.is_ascii_digit()).collect();
      if !digits.is_empty() {
          if let Ok(val) = digits.chars().rev().collect::<String>().parse::<f32>() {
              return val.max(60.0).min(180.0);
          }
      }
  }
  120.0
}

fn fake_key_from_filename(path: &str) -> String {
    // crude heuristic: look for common keys in filename
    let lower = path.to_lowercase();
    let keys = ["am", "bm", "cm", "dm", "em", "fm", "gm", "a", "b", "c", "d", "e", "f", "g"];
    for k in keys {
        if lower.contains(&format!(" {} ", k)) || lower.contains(&format!("_{}_", k)) {
            return k.to_uppercase();
        }
    }
    "Am".into()
}

fn fake_energy_from_size(path: &str) -> f32 {
    if let Ok(meta) = fs::metadata(path) {
        let size = meta.len() as f32;
        // normalize file size to a rough 0–1 energy
        let norm = (size / (50_000_000.0)).min(1.0); // 50MB cap
        (0.3 + norm * 0.7).min(1.0)
    } else {
        0.7
    }
}

fn fake_lufs_from_energy(energy: f32) -> f32 {
    // map energy to a rough LUFS target
    -18.0 + (energy * 6.0) // between -18 and -12
}

#[tauri::command]
pub fn analyze_track(path: String) -> Result<TrackAnalysis, String> {
    // You can later replace all of this with real DSP:
    // - BPM detection (aubio, etc.)
    // - Key detection
    // - LUFS measurement
    // - Intro/outro detection
    // - Vocal region detection

    let bpm = fake_bpm_from_filename(&path);
    let key = fake_key_from_filename(&path);
    let energy = fake_energy_from_size(&path);
    let lufs = fake_lufs_from_energy(energy);

    // Placeholder timing values (in ms) that still behave reasonably
    let intro_ms = 8000;
    let outro_ms = 12000;

    // Assume vocals start after intro and end a bit before track end.
    // You can later compute this from waveform / spectral analysis.
    let vocal_start_ms = intro_ms + 7000;
    let vocal_end_ms = vocal_start_ms + 180_000; // ~3 minutes of vocals

    Ok(TrackAnalysis {
        bpm,
        key,
        energy,
        intro_ms,
        outro_ms,
        vocal_start_ms,
        vocal_end_ms,
        lufs,
    })
}
