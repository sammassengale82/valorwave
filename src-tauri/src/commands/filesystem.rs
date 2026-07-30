use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::io;
use zip::ZipArchive;

use tauri::{AppHandle, Manager};

// -----------------------------
// Layout Save / Load (Tauri v2)
// -----------------------------

fn layout_path(app: &AppHandle) -> PathBuf {
    // Tauri v2: MUST use app.path().app_config_dir()
    let mut p = app
        .path()
        .app_config_dir()
        .unwrap_or(std::env::current_dir().unwrap());

    p.push("layout.json");
    p
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LayoutData {
    pub name: String,
    pub payload: String,
}

#[tauri::command]
pub fn save_layout(app: AppHandle, layout: LayoutData) -> Result<(), String> {
    let path = layout_path(&app);

    let json = serde_json::to_string_pretty(&layout)
        .map_err(|e| e.to_string())?;

    fs::write(path, json)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn load_layout(app: AppHandle) -> Result<LayoutData, String> {
    let path = layout_path(&app);

    let data = fs::read_to_string(path)
        .map_err(|e| e.to_string())?;

    serde_json::from_str(&data)
        .map_err(|e| e.to_string())
}

// -----------------------------
// Directory Scanning
// -----------------------------

#[tauri::command]
pub fn read_dir(path: String) -> Result<Vec<String>, String> {
    let entries = fs::read_dir(&path)
        .map_err(|e| e.to_string())?;

    let mut files = vec![];

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        files.push(entry.path().to_string_lossy().to_string());
    }

    Ok(files)
}

// -----------------------------
// ZIP Extraction
// -----------------------------

#[tauri::command]
pub fn unzip_file(path: String, dest: String) -> Result<(), String> {
    let file = fs::File::open(&path)
        .map_err(|e| e.to_string())?;

    let mut archive = ZipArchive::new(file)
        .map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)
            .map_err(|e| e.to_string())?;

        let outpath = Path::new(&dest).join(file.name());

        if file.is_dir() {
            fs::create_dir_all(&outpath)
                .map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = outpath.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| e.to_string())?;
            }

            let mut outfile = fs::File::create(&outpath)
                .map_err(|e| e.to_string())?;

            io::copy(&mut file, &mut outfile)
                .map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}
