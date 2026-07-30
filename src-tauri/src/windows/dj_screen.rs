use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};

pub fn open_dj_screen(app: AppHandle) -> tauri::Result<()> {
    if app.get_webview_window("dj").is_some() {
        return Ok(());
    }

    WebviewWindowBuilder::new(
        &app,
        "dj",
        WebviewUrl::App("index.html#/".into()) // MAINSCREEN route
    )
    .title("ValorWave DJ")
    .decorations(true)
    .resizable(true)
    .fullscreen(false)
    .build()?;

    Ok(())
}
