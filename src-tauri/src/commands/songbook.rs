use serde::Serialize;
use walkdir::WalkDir;


#[derive(Serialize)]
pub struct SongEntry {
    pub title: String,
    pub artist: String,
    pub path: String,
    pub is_karaoke: bool,
}

pub fn scan_songbook(root: &str) -> Vec<SongEntry> {
    let mut songs = Vec::new();

    for entry in WalkDir::new(root)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        let path = entry.path().to_string_lossy().to_string();

        let filename = entry.file_name().to_string_lossy().to_string();

        // Basic parsing: "Artist - Title.ext"
        let parts: Vec<&str> = filename.split('-').collect();
        let (artist, title) = if parts.len() >= 2 {
            (parts[0].trim().to_string(), parts[1].trim().to_string())
        } else {
            ("Unknown".into(), filename.clone())
        };

        let is_karaoke = path.ends_with(".cdg") || path.contains("[karaoke]");

        songs.push(SongEntry {
            title,
            artist,
            path,
            is_karaoke,
        });
    }

    songs
}
