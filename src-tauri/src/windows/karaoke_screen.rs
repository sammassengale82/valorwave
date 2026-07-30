use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};

pub fn open_karaoke_screen(app: AppHandle) -> tauri::Result<()> {
    if app.get_webview_window("karaoke").is_some() {
        return Ok(());
    }

    WebviewWindowBuilder::new(
        &app,
        "karaoke",
        WebviewUrl::App("index.html#/karaoke".into()) // KARAOKE route
    )
    .title("ValorWave Karaoke")
    .decorations(true)     // allow dragging
    .resizable(true)       // allow resizing
    .fullscreen(false)     // DO NOT hijack screen
    .build()?;

    Ok(())
}
