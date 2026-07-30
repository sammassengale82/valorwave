use serde::{Serialize, Deserialize};
use std::sync::Mutex;
use lazy_static::lazy_static;
use chrono::Utc;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Singer {
    pub id: u32,
    pub name: String,
    pub requested_song: Option<String>,
    pub request_count: u32,
    pub sung_count: u32,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SingerHistoryEntry {
    pub singer: String,
    pub song: String,
    pub timestamp: u64,
}

lazy_static! {
    pub static ref SINGERS: Mutex<Vec<Singer>> = Mutex::new(Vec::new());
    pub static ref SINGER_HISTORY: Mutex<Vec<SingerHistoryEntry>> = Mutex::new(Vec::new());
}

#[tauri::command]
pub fn singer_add(name: String) -> u32 {
    let mut singers = SINGERS.lock().unwrap();
    let id = singers.len() as u32;

    singers.push(Singer {
        id,
        name,
        requested_song: None,
        request_count: 0,
        sung_count: 0,
    });

    id
}

#[tauri::command]
pub fn singer_remove(id: u32) {
    let mut singers = SINGERS.lock().unwrap();
    singers.retain(|s| s.id != id);
}

#[tauri::command]
pub fn singer_set_song(id: u32, song: String) {
    let mut singers = SINGERS.lock().unwrap();
    if let Some(s) = singers.iter_mut().find(|x| x.id == id) {
        s.requested_song = Some(song);
        s.request_count += 1;
    }
}

#[tauri::command]
pub fn singer_next() -> Option<Singer> {
    let mut singers = SINGERS.lock().unwrap();
    if singers.is_empty() {
        return None;
    }

    let singer = singers.remove(0);
    singers.push(singer.clone());
    Some(singer)
}

#[tauri::command]
pub fn singer_peek() -> Option<Singer> {
    let singers = SINGERS.lock().unwrap();
    singers.first().cloned()
}

#[tauri::command]
pub fn singer_done(id: u32) {
    let mut singers = SINGERS.lock().unwrap();
    if let Some(s) = singers.iter_mut().find(|x| x.id == id) {
        s.sung_count += 1;
    }
}

#[tauri::command]
pub fn singer_add_history(singer: String, song: String) {
    let mut hist = SINGER_HISTORY.lock().unwrap();
    hist.push(SingerHistoryEntry {
        singer,
        song,
        timestamp: Utc::now().timestamp() as u64,
    });
}

#[tauri::command]
pub fn singer_get_history() -> Vec<SingerHistoryEntry> {
    SINGER_HISTORY.lock().unwrap().clone()
}

#[tauri::command]
pub fn singer_increment_sung(id: u32) {
    let mut singers = SINGERS.lock().unwrap();
    if let Some(s) = singers.iter_mut().find(|x| x.id == id) {
        s.sung_count += 1;
    }
}

#[tauri::command]
pub fn singer_list() -> Vec<Singer> {
    SINGERS.lock().unwrap().clone()
}

#[tauri::command]
pub fn singer_clear_history() {
    let mut hist = SINGER_HISTORY.lock().unwrap();
    hist.clear();
}
