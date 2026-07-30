import { extname, basename } from "@tauri-apps/api/path";

export async function parseMetadata(path: string) {
  const filename = await basename(path);
  const ext = await extname(path);

  // Basic title/artist parsing from filename
  let title = filename.replace(ext, "");
  let artist = "";

  if (title.includes(" - ")) {
    const parts = title.split(" - ");
    artist = parts[0];
    title = parts.slice(1).join(" - ");
  }

  return {
    filename,
    title,
    artist,
    duration: 0, // filled later by audio engine
    bpm: undefined,
    key: undefined,
  };
}
