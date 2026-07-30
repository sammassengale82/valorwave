use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::fs;

use lazy_static::lazy_static;

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

lazy_static! {
    pub static ref TRACK_DB: Mutex<HashMap<String, TrackMetadata>> =
        Mutex::new(load_trackdb());
}

fn load_trackdb() -> HashMap<String, TrackMetadata> {
    if let Ok(data) = fs::read_to_string("trackdb.json") {
        if let Ok(map) = serde_json::from_str(&data) {
            return map;
        }
    }
    HashMap::new()
}

fn save_trackdb(db: &HashMap<String, TrackMetadata>) {
    let _ = fs::write("trackdb.json", serde_json::to_string_pretty(db).unwrap());
}

#[tauri::command]
pub fn get_hotcues(path: String) -> Vec<Hotcue> {
    let db = TRACK_DB.lock().unwrap();
    db.get(&path).map(|t| t.hotcues.clone()).unwrap_or_default()
}

#[tauri::command]
pub fn set_hotcue(path: String, id: u8, time: f32) {
    let mut db = TRACK_DB.lock().unwrap();

    let entry = db.entry(path.clone()).or_insert(TrackMetadata {
        path: path.clone(),
        bpm: 0.0,
        key: "Unknown".into(),
        hotcues: vec![],
    });

    entry.hotcues.retain(|c| c.id != id);
    entry.hotcues.push(Hotcue { id, time });

    save_trackdb(&db);
}
