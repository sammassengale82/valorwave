// src-tauri/src/audio/engine.rs
use serde::Serialize;
use tauri::{AppHandle, Emitter};
use std::collections::HashMap;
use crate::audio::beatgrid::{Beatgrid, analyze_beatgrid};
use crate::audio::stems::{StemsState, StemGains};
use crate::audio::automix::{AutomixEngine, TrackMeta};
use crate::karaoke::cdg_player::CDGPlayer;
use crate::karaoke::requests::{RequestQueue, KaraokeRequest};
use crate::karaoke::pitch::PitchDetector;
use crate::audio::fx::FxParams;

#[derive(Default)]
pub struct AudioEngine {
    decks: HashMap<u32, DeckState>,
    beatgrids: HashMap<u32, Beatgrid>,
    stems: HashMap<u32, StemsState>,
    pub automix: AutomixEngine,
    cdg_players: HashMap<u32, CDGPlayer>,
    requests: RequestQueue,
    pitch: PitchDetector,
    pub automix_mode: String, // "dj", "karaoke", "smart"
    track_meta: HashMap<u32, TrackMeta>,
}

#[derive(Serialize)]
pub struct AudioLatency {
    pub ms: u32,
}

pub fn get_latency() -> AudioLatency {
    AudioLatency { ms: 12 }
}

#[derive(Clone, Debug)]
pub struct DeckState {
    pub track_path: Option<String>,
    pub cdg_path: Option<String>,
    pub is_playing: bool,
    pub position_sec: f32,
    pub duration_sec: f32,
    pub tempo_ratio: f32,
    pub loop_active: bool,
    pub loop_start_sec: f32,
    pub loop_end_sec: f32,
    pub slip_mode: bool,
    pub brake_amount: f32,
    pub filter_value: f32,
    pub echo_amount: f32,
    pub is_master: bool,
    pub hotcues: HashMap<u8, Hotcue>,
    pub slip_base_pos: f32,
    pub is_karaoke: bool,
    pub karaoke_position: f32,
    pub current_singer_id: Option<String>,
    pub fx: FxParams,
}

#[derive(Clone, Debug)]
pub struct Hotcue {
    pub position_sec: f32,
    pub color: String,
}

impl Default for DeckState {
    fn default() -> Self {
        Self {
            track_path: None,
            cdg_path: None,
            is_playing: false,
            position_sec: 0.0,
            duration_sec: 0.0,
            tempo_ratio: 1.0,
            loop_active: false,
            loop_start_sec: 0.0,
            loop_end_sec: 0.0,
            slip_mode: false,
            brake_amount: 0.0,
            filter_value: 0.0,
            echo_amount: 0.0,
            is_master: false,
            hotcues: HashMap::new(),
            slip_base_pos: 0.0,
            is_karaoke: false,
            karaoke_position: 0.0,
            current_singer_id: None,
            fx: FxParams::default(),
        }
    }
}

impl AudioEngine {
    fn compute_peaks(&self, samples: &[f32]) -> Vec<f32> {
        let window = 2048;
        let mut peaks = Vec::new();
        for chunk in samples.chunks(window) {
            let mut max = 0.0;
            for s in chunk {
                let v = s.abs();
                if v > max {
                    max = v;
                }
            }
            peaks.push(max);
        }
        peaks
    }

    pub fn new() -> Self {
        Self {
            decks: HashMap::new(),
            beatgrids: HashMap::new(),
            stems: HashMap::new(),
            automix: AutomixEngine::default(),
            cdg_players: HashMap::new(),
            requests: RequestQueue::default(),
            pitch: PitchDetector::default(),
            automix_mode: String::default(),
            track_meta: HashMap::new(),
        }
    }

    pub fn requests(&self) -> &RequestQueue {
        &self.requests
    }

    pub fn requests_mut(&mut self) -> &mut RequestQueue {
        &mut self.requests
    }

    fn deck_mut(&mut self, deck_id: u32) -> &mut DeckState {
        self.decks.entry(deck_id).or_default()
    }

    pub fn fx(&mut self, deck_id: u32) -> &mut FxParams {
        let deck = self.decks.entry(deck_id).or_default();
        &mut deck.fx
    }

    pub fn get_playing_deck(&self) -> Option<u32> {
        for (id, deck) in self.decks.iter() {
            if deck.is_playing {
                return Some(*id);
            }
        }
        None
    }

    pub fn prepare_next_track(&mut self, deck_id: u32) {
        if let Some(track_id) = self
            .automix
            .settings
            .queue
            .first()
            .map(|track| track.id.clone())
        {
            self.load_track(deck_id, &track_id, None);
        }
    }

    pub fn load_track(&mut self, deck_id: u32, path: &str, cdg_path: Option<&str>) {
        let deck = self.deck_mut(deck_id);
        deck.track_path = Some(path.to_string());
        deck.cdg_path = cdg_path.map(|s| s.to_string());
        deck.position_sec = 0.0;
    }

    pub fn play(&mut self, deck_id: u32) {
        let deck = self.deck_mut(deck_id);
        deck.is_playing = true;
        deck.slip_base_pos = deck.position_sec;
    }

    pub fn stop(&mut self, deck_id: u32) {
        let deck = self.deck_mut(deck_id);
        deck.is_playing = false;
    }

    pub fn is_playing(&self, deck_id: u32) -> bool {
        self.decks
            .get(&deck_id)
            .map(|d| d.is_playing)
            .unwrap_or(false)
    }

    pub fn set_tempo(&mut self, deck_id: u32, ratio: f32) {
        let deck = self.deck_mut(deck_id);
        deck.tempo_ratio = ratio;
    }

    pub fn set_loop(&mut self, deck_id: u32, beats: u32, _roll: bool) {
        let deck = self.deck_mut(deck_id);
        let start = deck.position_sec;
        let length = beats as f32 * 0.5;
        deck.loop_active = true;
        deck.loop_start_sec = start;
        deck.loop_end_sec = start + length;
    }

    pub fn clear_loop(&mut self, deck_id: u32) {
        let deck = self.deck_mut(deck_id);
        deck.loop_active = false;
    }

    pub fn beatjump(&mut self, deck_id: u32, beats: i32) {
        let deck = self.deck_mut(deck_id);
        let delta = beats as f32 * 0.5;
        if deck.slip_mode && deck.is_playing {
            deck.position_sec = (deck.position_sec + delta).max(0.0);
        } else {
            deck.position_sec = (deck.position_sec + delta).max(0.0);
            deck.slip_base_pos = deck.position_sec;
        }
    }

    pub fn cue(&mut self, deck_id: u32) {
        let deck = self.deck_mut(deck_id);
        if deck.slip_mode && deck.is_playing {
            deck.position_sec = 0.0;
        } else {
            deck.position_sec = 0.0;
            deck.slip_base_pos = 0.0;
        }
    }

    pub fn sync_to_master(&mut self, deck_id: u32) {
        let mut master_tempo = 1.0;
        let mut master_pos = 0.0;
        let mut found_master = false;
        for (_id, deck) in &self.decks {
            if deck.is_master {
                master_tempo = deck.tempo_ratio;
                master_pos = deck.position_sec;
                found_master = true;
                break;
            }
        }
        if !found_master {
            return;
        }
        if let Some(slave) = self.decks.get_mut(&deck_id) {
            slave.tempo_ratio = master_tempo;
            let phase_diff = master_pos - slave.position_sec;
            slave.position_sec += phase_diff * 0.5;
        }
    }

    pub fn set_hotcue(&mut self, deck_id: u32, index: u8, color: String) {
        let deck = self.deck_mut(deck_id);
        let pos = deck.position_sec;
        deck.hotcues.insert(
            index,
            Hotcue {
                position_sec: pos,
                color,
            },
        );
    }

    pub fn delete_hotcue(&mut self, deck_id: u32, index: u8) {
        let deck = self.deck_mut(deck_id);
        deck.hotcues.remove(&index);
    }

    pub fn trigger_hotcue(&mut self, deck_id: u32, index: u8) {
        let deck = self.deck_mut(deck_id);
        if let Some(hc) = deck.hotcues.get(&index) {
            if deck.slip_mode && deck.is_playing {
                deck.position_sec = hc.position_sec;
            } else {
                deck.position_sec = hc.position_sec;
                deck.slip_base_pos = hc.position_sec;
            }
        }
    }

    pub fn loop_in(&mut self, deck_id: u32) {
        let deck = self.deck_mut(deck_id);
        deck.loop_start_sec = deck.position_sec;
        deck.loop_active = false;
    }

    pub fn loop_out(&mut self, deck_id: u32) {
        let deck = self.deck_mut(deck_id);
        deck.loop_end_sec = deck.position_sec;
        deck.loop_active = true;
    }

    pub fn auto_loop(&mut self, deck_id: u32, beats: u32) {
        self.set_loop(deck_id, beats, false);
    }

    pub fn get_track_audio(&self, _deck_id: u32) -> (Vec<f32>, u32) {
        (Vec::new(), 44100)
    }

    pub fn set_echo(&mut self, deck_id: u32, amount: f32) {
        let clamped = amount.clamp(0.0, 1.0);
        let deck = self.deck_mut(deck_id);
        deck.echo_amount = clamped;
        self.fx(deck_id).echo_amount = clamped;
    }

    pub fn set_brake(&mut self, deck_id: u32, amount: f32) {
        let clamped = amount.clamp(0.0, 1.0);
        let deck = self.deck_mut(deck_id);
        deck.brake_amount = clamped;
        self.fx(deck_id).brake_amount = clamped;
    }

    pub fn set_slip(&mut self, deck_id: u32, enabled: bool) {
        let deck = self.deck_mut(deck_id);
        deck.slip_mode = enabled;
        self.fx(deck_id).slip_enabled = enabled;
    }

    pub fn set_filter(&mut self, deck_id: u32, value: f32) {
        let clamped = value.clamp(-1.0, 1.0);
        let deck = self.deck_mut(deck_id);
        deck.filter_value = clamped;
        self.fx(deck_id).filter_amount = clamped;
    }

    pub fn set_gain(&mut self, deck_id: u32, gain: f32) {
        if let Some(deck) = self.decks.get_mut(&deck_id) {
            deck.filter_value = gain;
        }
    }

    pub fn get_peaks(&self, deck_id: u32) -> Vec<f32> {
        let track_path = match self.decks.get(&deck_id) {
            Some(deck) => deck.track_path.clone().unwrap_or_default(),
            None => return Vec::new(),
        };
        
        let cache_path = format!("{}.peaks.json", track_path);
        if let Ok(data) = std::fs::read_to_string(&cache_path) {
            if let Ok(peaks) = serde_json::from_str::<Vec<f32>>(&data) {
                return peaks;
            }
        }

        let (samples, _sr) = self.get_track_audio(deck_id);
        let peaks = self.compute_peaks(&samples);
        let _ = std::fs::write(&cache_path, serde_json::to_string(&peaks).unwrap());
        peaks
    }

    pub fn get_position_cmd(&self, deck_id: u32) -> f32 {
        self.decks
            .get(&deck_id)
            .map(|d| d.position_sec)
            .unwrap_or(0.0)
    }

    pub fn set_position_cmd(&mut self, deck_id: u32, position: f32) {
    if let Some(deck) = self.decks.get_mut(&deck_id) {
        deck.position_sec = position;
    }
}

    pub fn get_duration(&self, deck_id: u32) -> f32 {
        self.decks
            .get(&deck_id)
            .map(|d| d.duration_sec)
            .unwrap_or(0.0)
    }

    pub fn emit_deck_state(&self, app: &AppHandle, deck_id: u32) {
        let deck = match self.decks.get(&deck_id) {
            Some(d) => d,
            None => return,
        };
        let beatgrid_exists = self.beatgrids.contains_key(&deck_id);
        let stems_exists = self.stems.contains_key(&deck_id);
        let payload = serde_json::json!({
            "deckId": deck_id,
            "peaks": self.get_peaks(deck_id),
            "position": deck.position_sec,
            "duration": deck.duration_sec,
            "hasBeatgrid": beatgrid_exists,
            "hasStems": stems_exists,
            "is_karaoke": deck.is_karaoke,
            "karaoke_position": deck.karaoke_position,
            "current_singer_id": deck.current_singer_id,
        });
        let _ = app.emit("deck_state", payload);
    }

    pub fn emit_beatgrid(&self, app: &AppHandle, deck_id: u32) {
        if let Some(grid) = self.get_beatgrid(deck_id) {
            let payload = serde_json::json!({
                "deckId": deck_id,
                "bpm": grid.bpm,
                "first_beat_sec": grid.first_beat_sec,
                "beats": grid.beats,
            });
            let _ = app.emit("deck_beatgrid", payload);
        }
    }

    pub fn set_beatgrid(&mut self, deck_id: u32, grid: Beatgrid) {
        self.beatgrids.insert(deck_id, grid);
    }

    pub fn get_beatgrid(&self, deck_id: u32) -> Option<&Beatgrid> {
        self.beatgrids.get(&deck_id)
    }

    pub fn analyze_track_beatgrid(&mut self, deck_id: u32) {
        let (samples, sample_rate) = self.get_track_audio(deck_id);
        let grid = analyze_beatgrid(&samples, sample_rate);
        self.set_beatgrid(deck_id, grid);
    }

    pub fn analyze_track_audio(&mut self, deck_id: u32) {
        let (samples, sr) = self.get_track_audio(deck_id);
        let (intro, outro) = self.automix.detect_intro_outro(&samples, sr);
        let deck = match self.decks.get(&deck_id) {
            Some(d) => d,
            None => return,
        };
        let meta = TrackMeta {
            id: deck.track_path.clone().unwrap_or_default(),
            title: "Unknown".into(),
            artist: "Unknown".into(),
            bpm: 120.0,
            key: None,
            duration_sec: deck.duration_sec,
            intro_sec: intro,
            outro_sec: outro,
            energy: 0.5,
        };
        self.track_meta.insert(deck_id, meta);
    }

    pub fn set_stems_enabled(&mut self, deck_id: u32, enabled: bool) {
        let entry = self.stems.entry(deck_id).or_default();
        entry.enabled = enabled;
    }

    pub fn set_stem_gains(&mut self, deck_id: u32, gains: StemGains) {
        let entry = self.stems.entry(deck_id).or_default();
        entry.gains = gains;
    }

    pub fn get_stems_state(&self, deck_id: u32) -> StemsState {
        self.stems.get(&deck_id).cloned().unwrap_or_default()
    }

    pub fn set_automix_enabled(&mut self, enabled: bool) {
        self.automix.settings.enabled = enabled;
    }

    pub fn set_automix_fade_duration(&mut self, sec: f32) {
        self.automix.settings.fade_duration_sec = sec;
    }

    pub fn set_automix_target_bpm(&mut self, bpm: Option<f32>) {
        self.automix.settings.target_bpm = bpm;
    }

    pub fn set_automix_next_deck(&mut self, deck_id: Option<u32>) {
        self.automix.settings.next_deck = deck_id;
    }

    pub fn get_automix_state(&self) -> AutomixEngine {
        self.automix.clone()
    }

    pub fn maybe_trigger_automix(&mut self, app: &AppHandle) {
        if !self.automix.settings.enabled {
            return;
        }
        let current_deck = match self.get_playing_deck() {
            Some(id) => id,
            None => return,
        };
        let next_deck = self.automix.pick_next_deck(current_deck);
        self.start_automix_transition(app, current_deck, next_deck);
    }

    pub fn start_automix_transition(&mut self, app: &AppHandle, from_deck: u32, to_deck: u32) {
        self.prepare_next_track(to_deck);
        self.sync_bpm(from_deck, to_deck);
        let fade_sec = self.automix.settings.fade_duration_sec;
        let _app_clone = app.clone();
        
        tauri::async_runtime::spawn(async move {
            let steps = 60;
            let step_time = fade_sec / steps as f32;
            for _i in 0..steps {
                tokio::time::sleep(std::time::Duration::from_millis((step_time * 1000.0) as u64)).await;
            }
        });

        let settings = self.automix.settings.clone();
        let _ = app.emit("automix_state", settings);
    }

    pub fn sync_bpm(&mut self, _from: u32, to: u32) {
        let ratio = 1.0;
        self.set_tempo(to, ratio);
    }

    pub fn crossfader(&mut self, from_deck: u32, to_deck: u32, fade_sec: f32) {
        let steps = 60;
        for i in 0..steps {
            let t = i as f32 / steps as f32;
            let from_gain = (1.0 - t).sqrt();
            let to_gain = t.sqrt();
            self.set_gain(from_deck, from_gain);
            self.set_gain(to_deck, to_gain);
        }
        self.stop(from_deck);
        self.play(to_deck);
    }

    pub fn set_automix_mode(&mut self, mode: String) {
        self.automix_mode = mode;
    }

    pub fn load_cdg(&mut self, deck_id: u32, data: Vec<u8>) {
        let mut player = CDGPlayer::new();
        player.load(&data);
        self.cdg_players.insert(deck_id, player);
    }

    pub fn start_cdg(&mut self, deck_id: u32, position_sec: f32) {
        if let Some(player) = self.cdg_players.get_mut(&deck_id) {
            player.start(position_sec);
        }
    }

    pub fn seek_cdg(&mut self, deck_id: u32, position_sec: f32) {
        if let Some(player) = self.cdg_players.get_mut(&deck_id) {
            player.seek(position_sec);
        }
    }

    pub fn render_cdg(&mut self, deck_id: u32, now_ms: f64) -> Option<Vec<u8>> {
        self.cdg_players
            .get_mut(&deck_id)
            .map(|p| p.render_frame(now_ms).to_vec())
    }

    pub fn add_request(&mut self, name: String, song: String) -> KaraokeRequest {
        self.requests.add(name, song)
    }

    pub fn approve_request(&mut self, id: u32) -> Option<KaraokeRequest> {
        self.requests.approve(id)
    }

    pub fn decline_request(&mut self, id: u32) {
        self.requests.decline(id);
    }

    pub fn request_list(&self) -> Vec<KaraokeRequest> {
        self.requests.list()
    }

    pub fn detect_pitch(&self, samples: Vec<f32>, sample_rate: usize) -> f32 {
        PitchDetector::detect_pitch(&samples, sample_rate)
    }

    pub fn set_deck_echo(&mut self, deck_id: u32, amount: f32) -> bool {
        if let Some(deck) = self.decks.get_mut(&deck_id) {
            deck.echo_amount = amount;
            true
        } else {
            false
        }
    }

    pub fn set_deck_brake(&mut self, deck_id: u32, amount: f32) -> bool {
        if let Some(deck) = self.decks.get_mut(&deck_id) {
            deck.brake_amount = amount;
            true
        } else {
            false
        }
    }

    pub fn set_deck_filter(&mut self, deck_id: u32, amount: f32) -> bool {
        if let Some(deck) = self.decks.get_mut(&deck_id) {
            deck.filter_value = amount;
            true
        } else {
            false
        }
    }

    pub fn set_deck_slip(&mut self, deck_id: u32, enabled: bool) -> bool {
        if let Some(deck) = self.decks.get_mut(&deck_id) {
            deck.slip_mode = enabled;
            true
        } else {
            false
        }
    }
}
