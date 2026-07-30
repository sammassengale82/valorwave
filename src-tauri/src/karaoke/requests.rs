use serde::{Deserialize, Serialize};
use std::collections::HashMap;


// ---------------------------
// BASIC REQUEST STRUCT
// ---------------------------
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KaraokeRequest {
    pub id: u32,
    pub name: String,
    pub song: String,
    pub status: String, // "Pending", "Approved", "Declined"
}

// ---------------------------
// SINGER STATS
// ---------------------------
#[derive(Clone, Serialize, Default)]
pub struct SingerStats {
    pub total_songs_sung: u32,
    pub avg_pitch: f32,
    pub avg_timing: f32,
    pub best_song: Option<String>,
}

// ---------------------------
// PERFORMANCE ENTRY
// ---------------------------
#[derive(Clone, Serialize)]
pub struct PerformanceEntry {
    pub song: String,
    pub pitch: f32,
    pub timing: f32,
    pub date: u64,
}

// ---------------------------
// SINGER PROFILE
// ---------------------------
#[derive(Clone, Serialize)]
pub struct SingerProfile {
    pub id: u32,
    pub name: String,
    pub notes: Option<String>,
    pub favorite_songs: Vec<String>,
    pub performance_history: Vec<PerformanceEntry>,
    pub stats: SingerStats,
}

// ---------------------------
// REQUEST QUEUE
// ---------------------------
#[derive(Default)]
pub struct RequestQueue {
    next_id: u32,
    requests: Vec<KaraokeRequest>,
    singers: HashMap<u32, SingerProfile>,
}

impl RequestQueue {
    pub fn new() -> Self {
        Self {
            next_id: 1,
            requests: Vec::new(),
            singers: HashMap::new(),
        }
    }

    pub fn list(&self) -> Vec<KaraokeRequest> {
        self.requests.clone()
    }

    pub fn add(&mut self, name: String, song: String) -> KaraokeRequest {
        let req = KaraokeRequest {
            id: self.next_id,
            name: name.clone(),
            song: song.clone(),
            status: "Pending".to_string(),
        };

        // Create singer profile if missing
        self.singers.entry(self.next_id).or_insert(SingerProfile {
            id: self.next_id,
            name,
            notes: None,
            favorite_songs: Vec::new(),
            performance_history: Vec::new(),
            stats: SingerStats::default(),
        });

        self.next_id += 1;
        self.requests.push(req.clone());
        req
    }

    pub fn approve(&mut self, id: u32) -> Option<KaraokeRequest> {
        if let Some(req) = self.requests.iter_mut().find(|r| r.id == id) {
            req.status = "Approved".to_string();
            return Some(req.clone());
        }
        None
    }

    pub fn decline(&mut self, id: u32) -> Option<KaraokeRequest> {
        if let Some(req) = self.requests.iter_mut().find(|r| r.id == id) {
            req.status = "Declined".to_string();
            return Some(req.clone());
        }
        None
    }

    pub fn get_singer_stats(&self, id: u32) -> Option<SingerStats> {
        self.singers.get(&id).map(|s| s.stats.clone())
    }

    pub fn get_singer_profile(&self, id: u32) -> Option<SingerProfile> {
        self.singers.get(&id).cloned()
    }

    pub fn update_singer_notes(&mut self, id: u32, notes: String) -> Option<()> {
        if let Some(singer) = self.singers.get_mut(&id) {
            singer.notes = Some(notes);
            return Some(());
        }
        None
    }

    pub fn add_favorite_song(&mut self, id: u32, song: String) -> Option<()> {
        if let Some(singer) = self.singers.get_mut(&id) {
            if !singer.favorite_songs.contains(&song) {
                singer.favorite_songs.push(song);
            }
            return Some(());
        }
        None
    }

    pub fn remove_favorite_song(&mut self, id: u32, song: String) -> Option<()> {
        if let Some(singer) = self.singers.get_mut(&id) {
            singer.favorite_songs.retain(|s| s != &song);
            return Some(());
        }
        None
    }


}
