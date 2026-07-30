use tauri::{AppHandle, Manager};
use std::sync::Mutex;

mod kiosk_server;
mod songdb;
mod windows;
mod karaoke;
mod trackdb;
mod cdg;
mod audio;

pub mod commands;

use crate::commands::mixer::MixerState;
use crate::audio::engine::AudioEngine;

// -----------------------------
// Songbook Commands (⭐ ASYNC CONVERSION TO PREVENT UI FREEZING)
// -----------------------------
#[tauri::command]
async fn scan_songbook_cmd(root: String) -> Result<Vec<songdb::SongEntry>, String> {
    // Tauri handles async fn by offloading them to a non-blocking background thread pool
    Ok(songdb::scan_songbook(&root))
}

#[tauri::command]
async fn import_music_folder(folder: String) -> Result<(), String> {
    songdb::import_folder(&folder).map_err(|e| e.to_string())
}

#[tauri::command]
async fn load_song_database() -> Result<songdb::SongDatabase, String> {
    Ok(songdb::SongDatabase::load())
}

#[tauri::command]
async fn increment_request_count(song_path: String) -> Result<(), String> {
    let mut db = songdb::SongDatabase::load();
    if let Some(song) = db.songs.iter_mut().find(|s| s.path == song_path) {
        song.request_count += 1;
    }
    db.save();
    Ok(())
}

#[tauri::command]
async fn increment_sung_count(song_path: String) -> Result<(), String> {
    let mut db = songdb::SongDatabase::load();
    if let Some(song) = db.songs.iter_mut().find(|s| s.path == song_path) {
        song.sung_count += 1;
    }
    db.save();
    Ok(())
}

#[tauri::command]
async fn increment_favorite_count(song_path: String) -> Result<(), String> {
    let mut db = songdb::SongDatabase::load();
    if let Some(song) = db.songs.iter_mut().find(|s| s.path == song_path) {
        song.favorite_count += 1;
    }
    db.save();
    Ok(())
}

#[tauri::command]
async fn remove_music_folder(folder: String) -> Result<(), String> {
    songdb::remove_folder(&folder);
    Ok(())
}

#[tauri::command]
async fn rescan_music_folder(folder: String) -> Result<(), String> {
    songdb::import_folder(&folder).map_err(|e| e.to_string())
}

// -----------------------------
// Window Commands
// -----------------------------
#[tauri::command]
fn open_dj_screen_cmd(app: AppHandle) -> Result<(), String> {
    windows::open_dj_screen(app).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_karaoke_screen_cmd(app: AppHandle) -> Result<(), String> {
    windows::open_karaoke_screen(app).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_venue_screen_cmd(app: AppHandle) -> Result<(), String> {
    windows::open_venue_screen(app).map_err(|e| e.to_string())
}

// -----------------------------
// Tauri Entry Point
// -----------------------------
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .manage(Mutex::new(AudioEngine::new()))
        .setup(|app| {
            kiosk_server::start_kiosk_server(app.handle().clone());
            Ok(())
        })
        .manage(Mutex::new(MixerState::default()))
        .invoke_handler(tauri::generate_handler![
            // Automix commands
            commands::automix::set_automix_enabled,
            commands::automix::set_automix_target_bpm,
            commands::automix::add_automix_track,
            commands::automix::update_deck_position,
            commands::automix::set_automix_mode,

            // Hotcue commands
            trackdb::get_hotcues,
            trackdb::set_hotcue,

            // Built-in command modules
            commands::audio::get_output_devices,
            commands::filesystem::save_layout,
            commands::filesystem::load_layout,
            commands::filesystem::read_dir,
            commands::filesystem::unzip_file,
            commands::system::get_system_metrics,
            commands::audio::get_audio_latency,

            // Songbook (⭐ Bound async handlers safely here)
            scan_songbook_cmd,
            import_music_folder,
            load_song_database,
            increment_request_count,
            increment_sung_count,
            increment_favorite_count,
            remove_music_folder,
            rescan_music_folder,

            // Windows
            open_dj_screen_cmd,
            open_karaoke_screen_cmd,
            open_venue_screen_cmd,

            // FX
            commands::mixer::set_pitch,
            commands::mixer::set_key_shift,
            commands::mixer::toggle_key_lock,
            commands::mixer::toggle_vinyl_mode,
            commands::mixer::toggle_slip_mode,
            commands::mixer::toggle_reverse,
            commands::mixer::set_brake,
            commands::mixer::set_eq,
            commands::mixer::set_filter,
            commands::mixer::set_gain,
            commands::mixer::set_channel_fader,
            commands::mixer::set_crossfader,
            commands::mixer::set_mic_gain,
            commands::mixer::set_mic_eq,
            commands::mixer::set_mic_echo,
            commands::mixer::set_mic_ducking,
            commands::mixer::set_echo,
            commands::mixer::set_slip,
            audio::fx::set_echo_param,
            audio::fx::set_brake_param,
            audio::fx::set_filter_param,
            audio::fx::toggle_slip_param,

            // Audio Engine commands (⭐ FIXED paths to match module sub-namespace structures)
            commands::audio::get_position_cmd,
            commands::audio::load_track_cmd,
            commands::audio::play_cmd,
            commands::audio::stop_cmd,
            commands::audio::set_tempo_cmd,
            commands::audio::set_loop_cmd,
            commands::audio::clear_loop_cmd,
            commands::audio::beatjump_cmd,
            commands::audio::set_position_cmd,

            // Transport
            commands::transport::deck_play_pause,
            commands::transport::deck_cue,
            commands::transport::deck_sync,
            commands::transport::deck_trigger_hotcue,
            commands::transport::deck_loop_in,
            commands::transport::deck_loop_out,
            commands::transport::deck_auto_loop,
            commands::transport::deck_beatjump,
            commands::transport::deck_set_hotcue,
            commands::transport::deck_delete_hotcue,

            // Stems
            commands::stems::set_stems_enabled,
            commands::stems::set_stem_gains,

            // CDG
            commands::cdg::cdg_load,
            commands::cdg::cdg_start,
            commands::cdg::cdg_seek,
            commands::cdg::cdg_render,
            commands::cdg::get_cdg_frame,

            // Singers
            karaoke::singers::singer_add,
            karaoke::singers::singer_remove,
            karaoke::singers::singer_set_song,
            karaoke::singers::singer_next,
            karaoke::singers::singer_peek,
            karaoke::singers::singer_done,
            karaoke::singers::singer_add_history,
            karaoke::singers::singer_get_history,
            karaoke::singers::singer_increment_sung,
            karaoke::singers::singer_list,
            karaoke::singers::singer_clear_history,

            // Requests
            commands::requests::request_add,
            commands::requests::request_approve,
            commands::requests::request_decline,
            commands::requests::request_list,

            // Pitch
            commands::pitch::pitch_detect,

            // Window
            commands::window::open_karaoke_window,
            commands::window::close_karaoke_window,

            // Karaoke
            commands::karaoke::get_singer_profile,
            commands::karaoke::get_singer_stats,
            commands::karaoke::update_singer_notes,
            commands::karaoke::add_favorite_song,
            commands::karaoke::remove_favorite_song,

            // Analysis
            audio::analysis::analyze_track,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
