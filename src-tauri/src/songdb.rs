use serde::{Serialize, Deserialize};
use walkdir::WalkDir;
use std::fs;
use std::collections::HashMap;
use std::sync::Mutex;


#[derive(Serialize, Deserialize, Clone)]
pub struct SongEntry {
    pub title: String,
    pub artist: String,
    pub path: String,
    pub is_karaoke: bool,
    pub request_count: u32,
    pub sung_count: u32,
    pub favorite_count: u32,
}

#[derive(Serialize, Deserialize)]
pub struct SongDatabase {
    pub folders: Vec<String>,
    pub songs: Vec<SongEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Hotcue {
    pub id: u8,
    pub time: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackMetadata {
    pub path: String,
    pub bpm: f32,
    pub key: String,
    pub hotcues: Vec<Hotcue>,
}

impl SongDatabase {
    pub fn load() -> Self {
        let path = "songdb.json";
        if let Ok(data) = fs::read_to_string(path) {
            if let Ok(db) = serde_json::from_str(&data) {
                return db;
            }
        }
        SongDatabase { folders: vec![], songs: vec![] }
    }

    pub fn save(&self) {
        let _ = fs::write("songdb.json", serde_json::to_string_pretty(self).unwrap());
    }
}

pub fn import_folder(folder: &str) -> Result<(), Box<dyn std::error::Error>> {
    let mut db = SongDatabase::load();

    if !db.folders.contains(&folder.to_string()) {
        db.folders.push(folder.to_string());
    }

    for entry in WalkDir::new(folder)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        let path = entry.path().to_string_lossy().to_string();
        let filename = entry.file_name().to_string_lossy().to_string();

        let is_karaoke = path.ends_with(".cdg")
            || path.ends_with(".zip")
            || path.ends_with(".kar")
            || path.contains("[karaoke]");

        let parts: Vec<&str> = filename.split('-').collect();
        let (artist, title) = if parts.len() >= 2 {
            (parts[0].trim().to_string(), parts[1].trim().to_string())
        } else {
            ("Unknown".into(), filename.clone())
        };

        db.songs.push(SongEntry {
            title,
            artist,
            path,
            is_karaoke,
            request_count: 0,
            sung_count: 0,
            favorite_count: 0,
        });
    }

    db.songs.sort_by(|a, b| a.path.cmp(&b.path));
    db.songs.dedup_by(|a, b| a.path == b.path);

    db.save();
    Ok(())
}

pub fn remove_folder(folder: &str) {
    let mut db = SongDatabase::load();
    db.folders.retain(|f| f != folder);
    db.songs.retain(|s| !s.path.starts_with(folder));
    db.save();
}

pub fn rescan_folder(folder: &str) -> Result<(), Box<dyn std::error::Error>> {
    import_folder(folder)
}

pub fn scan_songbook(root: &str) -> Vec<SongEntry> {
    let mut songs = vec![];

    for entry in WalkDir::new(root)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        let path = entry.path().to_string_lossy().to_string();
        let filename = entry.file_name().to_string_lossy().to_string();

        let parts: Vec<&str> = filename.split('-').collect();
        let (artist, title) = if parts.len() >= 2 {
            (parts[0].trim().to_string(), parts[1].trim().to_string())
        } else {
            ("Unknown".into(), filename.clone())
        };

        let is_karaoke = path.ends_with(".cdg")
            || path.ends_with(".zip")
            || path.ends_with(".kar")
            || path.contains("[karaoke]");

        songs.push(SongEntry {
            title,
            artist,
            path,
            is_karaoke,
            request_count: 0,
            sung_count: 0,
            favorite_count: 0,
        });

    }

    songs
}
