use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct Beatgrid {
    pub bpm: f32,
    pub first_beat_sec: f32,
    pub beats: Vec<f32>, // seconds
}

pub fn analyze_beatgrid(samples: &[f32], sample_rate: f32) -> Beatgrid {
    // SUPER SIMPLE stub: replace with real onset/BPM detection later
    let bpm = 128.0;
    let first_beat_sec = 0.0;

    // generate a straight grid
    let beat_interval = 60.0 / bpm;
    let duration_sec = samples.len() as f32 / sample_rate;
    let mut beats = Vec::new();
    let mut t = first_beat_sec;
    while t < duration_sec {
        beats.push(t);
        t += beat_interval;
    }

    Beatgrid {
        bpm,
        first_beat_sec,
        beats,
    }
}
