use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

fn avatars_dir(app: &AppHandle) -> PathBuf {
    let app_dir = app
        .path_resolver()
        .app_data_dir()
        .unwrap_or_else(|| PathBuf::from("./valorwave_data"));
    app_dir.join("avatars")
}

#[tauri::command]
pub fn save_singer_avatar(app: AppHandle, singer_id: String, data: Vec<u8>) -> Result<String, String> {
    let dir = avatars_dir(&app);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let file_path = dir.join(format!("{}.png", singer_id));
    fs::write(&file_path, data).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_singer_avatar(app: AppHandle, singer_id: String) -> Result<Option<String>, String> {
    let dir = avatars_dir(&app);
    let file_path = dir.join(format!("{}.png", singer_id));

    if file_path.exists() {
        Ok(Some(file_path.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}
