import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSingerRotation } from "../../hooks/useSingerRotation";
import { useSingerState } from "../../state/singerState";
import "../../styles/songbrowser.css";

interface SongEntry {
  title: string;
  artist: string;
  path: string;
  is_karaoke: boolean;
  cdg_path?: string;
}

interface SongBrowserProps {
  onLoadToDeck?: (deckId: number, song: SongEntry) => void;
  kioskMode?: boolean;
}

export const SongBrowser: React.FC<SongBrowserProps> = ({
  onLoadToDeck,
  kioskMode,
}) => {
  const [songs, setSongs] = useState<SongEntry[]>([]);
  const [query, setQuery] = useState("");
  const [selectedSingerId, setSelectedSingerId] = useState<number | null>(null);

  const singers = useSingerState((s) => s.singers);
  const { setSingerSong, refreshSingers } = useSingerRotation();

  useEffect(() => {
    (async () => {
      try {
        const result = await invoke<SongEntry[]>("scan_songbook_cmd", {
          root: "songbook_root",
        });
        setSongs(result);
        await refreshSingers();
      } catch (err) {
        console.error("Failed to load songbook database", err);
      }
    })();
  }, [refreshSingers]);

  const filtered = songs.filter((s) => {
    const q = query.toLowerCase();
    return (
      s.is_karaoke &&
      (s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.path.toLowerCase().includes(q))
    );
  });

  const handleRequestSong = async (
    song: SongEntry,
    targetId?: number | null
  ) => {
    const activeId = targetId ?? selectedSingerId;

    if (activeId == null) {
      if (singers.length === 0) {
        alert("Please add singers to the rotation first.");
        return;
      }

      const namesList = singers
        .map((s, idx) => `${idx + 1}: ${s.name}`)
        .join("\n");
      const selection = prompt(
        `Select singer index number for request:\n\n${namesList}`
      );
      if (!selection) return;

      const chosenIdx = parseInt(selection, 10) - 1;
      const targetSinger = singers[chosenIdx];
      if (targetSinger) {
        await setSingerSong(targetSinger.id, song.path);
        await refreshSingers();
      }
      return;
    }

    await setSingerSong(activeId, song.path);
    await refreshSingers();
  };

  return (
    <div className="songbrowser">
      {/* HEADER */}
      <div className="songbrowser-top">
        <input
          className="songbrowser-search"
          placeholder="Quick search karaoke books..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {!kioskMode && (
          <select
            className="songbrowser-singer-select"
            value={selectedSingerId ?? ""}
            onChange={(e) =>
              setSelectedSingerId(
                e.target.value ? Number(e.target.value) : null
              )
            }
          >
            <option value="">-- Target Active Singer --</option>
            {singers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* LIST */}
      <div className="songbrowser-list">
        <div className="songbrowser-header-row">
          <div>TITLE</div>
          <div>ARTIST</div>
          <div className="songbrowser-header-actions">ACTIONS</div>
        </div>

        {filtered.map((song) => (
          <div key={song.path} className="songbrowser-row">
            <div className="songbrowser-cell songbrowser-title">
              🎤 {song.title}
            </div>
            <div className="songbrowser-cell songbrowser-artist">
              {song.artist || "Unknown Artist"}
            </div>
            <div className="songbrowser-cell songbrowser-actions">
              {onLoadToDeck && (
                <button
                  className="songbrowser-load-btn"
                  onClick={() => onLoadToDeck(1, song)}
                >
                  LOAD
                </button>
              )}
              {!kioskMode && (
                <button
                  className="songbrowser-request-btn"
                  onClick={() => handleRequestSong(song)}
                >
                  REQ
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SongBrowser;
