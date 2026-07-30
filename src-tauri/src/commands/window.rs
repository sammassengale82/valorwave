use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};

/// Open karaoke window and navigate to /karaoke
#[tauri::command]
pub fn open_karaoke_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("karaoke") {
        win.show().map_err(|e| e.to_string())?;
        win.set_focus().map_err(|e| e.to_string())?;

        // Navigate to the correct karaoke route
        win.eval("window.location.hash = '#/karaoke';")
            .map_err(|e| e.to_string())?;

        Ok(())
    } else {
        WebviewWindowBuilder::new(
            &app,
            "karaoke",
            WebviewUrl::App("index.html#/karaoke".into()),
        )
        .title("ValorWave Karaoke")
        .decorations(true)     // allow dragging
        .resizable(true)       // allow resizing
        .fullscreen(false)     // DO NOT hijack the screen
        .build()
        .map_err(|e| e.to_string())?;

        Ok(())
    }
}

/// Hide karaoke window
#[tauri::command]
pub fn close_karaoke_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("karaoke") {
        win.hide().map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("karaoke window not found".into())
    }
}
