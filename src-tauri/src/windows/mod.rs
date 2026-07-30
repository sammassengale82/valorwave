pub mod dj_screen;
pub mod karaoke_screen;
pub mod venue_screen;

use tauri::AppHandle;

pub fn open_dj_screen(app: AppHandle) -> tauri::Result<()> {
    dj_screen::open_dj_screen(app)
}

pub fn open_karaoke_screen(app: AppHandle) -> tauri::Result<()> {
    karaoke_screen::open_karaoke_screen(app)
}

pub fn open_venue_screen(app: AppHandle) -> tauri::Result<()> {
    venue_screen::open_venue_screen(app)
}
