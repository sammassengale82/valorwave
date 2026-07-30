use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};

pub fn open_venue_screen(app: AppHandle) -> tauri::Result<()> {
    if app.get_webview_window("venue").is_some() {
        return Ok(());
    }

    WebviewWindowBuilder::new(
        &app,
        "venue",
        WebviewUrl::App("index.html#/venue".into()) // VENUE route
    )
    .title("ValorWave Venue")
    .decorations(true)
    .resizable(true)
    .fullscreen(false)
    .build()?;

    Ok(())
}
