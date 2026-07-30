import { invoke } from "@tauri-apps/api/core";
import { extname, basename } from "@tauri-apps/api/path";
import { parseMetadata } from "./metadataParser";
import { TrackMetadata } from "../state/libraryState";

const AUDIO_EXT = [".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg"];
const CDG_EXT = [".cdg"];
const ZIP_EXT = [".zip"];

/**
 * Read folder contents using Rust backend (Tauri v2)
 */
export async function readFolder(path: string) {
  const entries: string[] = await invoke("read_dir", { path });

  const folders: string[] = [];
  const audioFiles: string[] = [];
  const cdgFiles: string[] = [];
  const zipFiles: string[] = [];

  for (const entry of entries) {
    const ext = (await extname(entry)).toLowerCase();

    if (AUDIO_EXT.includes(ext)) audioFiles.push(entry);
    else if (CDG_EXT.includes(ext)) cdgFiles.push(entry);
    else if (ZIP_EXT.includes(ext)) zipFiles.push(entry);

    // Folder detection (simple heuristic)
    if (!ext) folders.push(entry);
  }

  return { folders, audioFiles, cdgFiles, zipFiles };
}

/**
 * Extract ZIP karaoke packs using Rust backend unzip_file command
 */
export async function extractZipKaraoke(zipPath: string, outputDir: string) {
  await invoke("unzip_file", { path: zipPath, dest: outputDir });

  const extracted: string[] = await invoke("read_dir", { path: outputDir });

  let mp3: string | null = null;
  let cdg: string | null = null;

  for (const f of extracted) {
    const ext = (await extname(f)).toLowerCase();

    if (AUDIO_EXT.includes(ext) && !mp3) mp3 = f;
    else if (CDG_EXT.includes(ext) && !cdg) cdg = f;
  }

  if (!mp3 || !cdg) return null;

  return { mp3Path: mp3, cdgPath: cdg };
}

/**
 * Pair MP3 + CDG files
 */
export async function pairCdgWithMp3(audioFiles: string[], cdgFiles: string[]) {
  const pairs: { mp3: string; cdg: string }[] = [];

  for (const mp3 of audioFiles) {
    const base = mp3.replace(await extname(mp3), "");
    const cdg = cdgFiles.find((c) => c.replace(".cdg", "") === base);
    if (cdg) pairs.push({ mp3, cdg });
  }

  return pairs;
}

/**
 * Load all tracks from a folder
 */
export async function loadTracksFromFolder(path: string) {
  const { audioFiles, cdgFiles, zipFiles } = await readFolder(path);

  const tracks: TrackMetadata[] = [];

  // Pair CDG + MP3
  const cdgPairs = await pairCdgWithMp3(audioFiles, cdgFiles);

  for (const { mp3, cdg } of cdgPairs) {
    const meta = await parseMetadata(mp3);
    tracks.push({
      ...meta,
      id: crypto.randomUUID(),
      path: mp3,
      cdgPath: cdg,
      is_karaoke: true,
    });
  }

  // Audio-only files
  for (const file of audioFiles) {
    if (cdgPairs.some((p) => p.mp3 === file)) continue;

    const meta = await parseMetadata(file);
    tracks.push({
      ...meta,
      id: crypto.randomUUID(),
      path: file,
      is_karaoke: false,
    });
  }

  // ZIP karaoke packs
  for (const zip of zipFiles) {
    const outDir = zip.replace(".zip", "_unzipped");
    const extracted = await extractZipKaraoke(zip, outDir);
    if (!extracted) continue;

    const meta = await parseMetadata(extracted.mp3Path);
    tracks.push({
      ...meta,
      id: crypto.randomUUID(),
      path: extracted.mp3Path,
      cdgPath: extracted.cdgPath,
      zipPath: zip,
      is_karaoke: true,
    });
  }

  return tracks;
}
