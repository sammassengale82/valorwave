import React, { useEffect, useState } from "react";
import { useSongbookState } from "../../state/songbookState";
import { useSingerState } from "../../state/singerState";
import "../../styles/songbookPanel.css";
import { invoke } from "@tauri-apps/api/core";

const SongbookPanel: React.FC = () => {
  const { songs, filters, setFilters, loadSongbook, rankedSongs, dbFolders } =
    useSongbookState();

  const { activeSinger, singers, addPendingRequest } = useSingerState();
  const singer = singers.find((s) => s.id === activeSinger);

  const [query, setQuery] = useState("");

  useEffect(() => {
    loadSongbook();
  }, []);

  const results = rankedSongs(query, activeSinger ? String(activeSinger) : undefined);
  const recommended = rankedSongs("", activeSinger ? String(activeSinger) : undefined).slice(0, 10);

  const popular = [...songs]
    .sort(
      (a, b) =>
        b.request_count +
        b.sung_count +
        b.favorite_count -
        (a.request_count + a.sung_count + a.favorite_count)
    )
    .slice(0, 10);

  async function handleImportFolder() {
    const folder = await invoke<string>("open_folder_dialog");
    if (folder) {
      await invoke("import_music_folder", { folder });
      await loadSongbook();
    }
  }

  function requestSong(songPath: string) {
    if (!activeSinger) return;
    addPendingRequest(activeSinger, songPath);
    invoke("increment_request_count", { songPath });
  }

  return (
    <div className="sb-panel">
      <h2 className="sb-title">Songbook</h2>

      <button className="sb-btn-main" onClick={handleImportFolder}>
        + Add Music Folder
      </button>

      <input
        className="sb-search"
        placeholder="Search songs or artists..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="sb-filters">
        <label className="sb-filter">
          <input
            type="checkbox"
            checked={filters.karaokeOnly}
            onChange={(e) => setFilters({ karaokeOnly: e.target.checked })}
          />
          Karaoke Only
        </label>
      </div>

      {singer && (
        <section className="sb-section">
          <h3 className="sb-section-title">Recommended for {singer.name}</h3>
          <ul className="sb-list">
            {recommended.map((song, i) => (
              <li key={i} className="sb-item">
                <div className="sb-meta">
                  <strong className="sb-title-text">{song.title}</strong>
                  <div className="sb-artist">{song.artist}</div>
                </div>
                <button className="sb-request-btn" onClick={() => requestSong(song.path)}>
                  Request
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="sb-section">
        <h3 className="sb-section-title">Popular Songs</h3>
        <ul className="sb-list">
          {popular.map((song, i) => (
            <li key={i} className="sb-item">
              <div className="sb-meta">
                <strong className="sb-title-text">{song.title}</strong>
                <div className="sb-artist">{song.artist}</div>
              </div>
              <button className="sb-request-btn" onClick={() => requestSong(song.path)}>
                Request
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="sb-section">
        <h3 className="sb-section-title">Search Results</h3>
        <ul className="sb-list">
          {results.map((song, i) => (
            <li key={i} className="sb-item">
              <div className="sb-meta">
                <strong className="sb-title-text">{song.title}</strong>
                <div className="sb-artist">{song.artist}</div>
              </div>
              <button className="sb-request-btn" onClick={() => requestSong(song.path)}>
                Request
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="sb-section">
        <h3 className="sb-section-title">Folders</h3>
        <ul className="sb-list">
          {dbFolders.map((folder, i) => (
            <li key={i} className="sb-item">
              <span className="sb-folder">{folder}</span>

              <div className="sb-folder-actions">
                <button
                  className="sb-btn-small"
                  onClick={() => invoke("rescan_music_folder", { folder })}
                >
                  Rescan
                </button>

                <button
                  className="sb-btn-small sb-danger"
                  onClick={() => invoke("remove_music_folder", { folder })}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default SongbookPanel;
