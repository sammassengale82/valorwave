#[derive(Debug, Clone, Default)]
pub struct PitchDetector;

impl PitchDetector {
    pub fn detect_pitch(samples: &[f32], sample_rate: usize) -> f32 {
        let size = samples.len();
        let mut max_corr = 0.0;
        let mut best_lag = 0;

        for lag in 50..500 {
            let mut corr = 0.0;
            for i in 0..(size - lag) {
                corr += samples[i] * samples[i + lag];
            }
            if corr > max_corr {
                max_corr = corr;
                best_lag = lag;
            }
        }

        if best_lag == 0 {
            return 0.0;
        }

        sample_rate as f32 / best_lag as f32
    }
}
