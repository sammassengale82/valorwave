use serde::Serialize;


#[derive(Clone, Debug, Serialize)]
pub struct Beatgrid {
    pub bpm: f32,
    pub first_beat_sec: f32,
    pub beats: Vec<f32>,
}

/// Very simple stub analyzer:
/// - assumes fixed BPM
/// - generates a grid over the whole track
pub fn analyze_beatgrid(samples: &[f32], sample_rate: u32) -> Beatgrid {
    // TODO: replace with real onset/BPM detection
    let bpm = 128.0;
    let beat_interval = 60.0 / bpm;

    let duration_sec = samples.len() as f32 / sample_rate as f32;
    let mut beats = Vec::new();

    let mut t = 0.0;
    while t < duration_sec {
        beats.push(t);
        t += beat_interval;
    }

    Beatgrid {
        bpm,
        first_beat_sec: 0.0,
        beats,
    }
}
