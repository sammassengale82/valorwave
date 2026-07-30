import React, { useState, useEffect, useRef, useCallback } from "react";
import { Virtuoso } from "react-virtuoso";

import { audioEngine } from "../../engine/audioEngine";
import { useLibraryState, TrackMetadata } from "../../state/libraryState";
import { AutomixPanel } from "../automix/AutoMixPanel";
import PlaylistPanel from "./PlaylistPanel";
import SearchBar from "./SearchBar";
import TrackRow from "./TrackRow";
import BrowserContextMenu from "./BrowserContextMenu";

import "../../styles/browser.css";

interface Props {
  onLoadToDeck: (deckId: number, path: string, cdgPath?: string) => void;
}

type SortField = "title" | "artist" | "bpm" | "key" | "duration";

const BrowserPanel: React.FC<Props> = ({ onLoadToDeck }) => {
  const {
    tracks,
    searchQuery,
    setSearchQuery,
    addTracks,
    playlists,
    crates,
  } = useLibraryState();

  const [sortField, setSortField] = useState<SortField>("title");
  const [sortAscending, setSortAscending] = useState(true);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    track: TrackMetadata | null;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        searchInputRef.current?.focus();
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "m") {
        // Toggle automix (global hotkey)
        const toggleEvent = new CustomEvent("valorwave-toggle-automix");
        window.dispatchEvent(toggleEvent);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAscending(!sortAscending);
    else {
      setSortField(field);
      setSortAscending(true);
    }
  };

  const openFolder = async () => {
    const selected = await (window as any).__TAURI__.dialog.open({
      directory: true,
      multiple: false,
    });
    if (!selected) return;

    const entries = await (window as any).__TAURI__.fs.readDir(selected);
    const audioFiles = entries.filter((e: any) =>
      e.name.match(/\.(mp3|wav|flac|ogg|zip|cdg)$/i)
    );

    const imported: TrackMetadata[] = [];

    for (const file of audioFiles) {
      const fullPath = file.path;
      const filename = file.name;

      let isKaraoke = false;
      let cdgPath: string | undefined;
      let zipPath: string | undefined;

      if (filename.toLowerCase().endsWith(".zip")) {
        isKaraoke = true;
        zipPath = fullPath;
        const cdg = await audioEngine.extractCDGFromZip(fullPath);
        if (typeof cdg === "string") cdgPath = cdg;
      } else if (filename.toLowerCase().endsWith(".cdg")) {
        isKaraoke = true;
        cdgPath = fullPath;
      }

      const metadata = (await audioEngine.analyzeTrack(fullPath)) as TrackMetadata;

      imported.push({
        id: crypto.randomUUID(),
        path: fullPath,
        filename,
        title: metadata.title ?? filename.replace(/\.[^.]+$/, ""),
        artist: metadata.artist ?? "",
        duration: metadata.duration ?? 0,
        bpm: metadata.bpm,
        key: metadata.key,
        is_karaoke: isKaraoke,
        cdgPath,
        zipPath,
      });
    }

    addTracks(imported);
  };

  const filtered = Object.values(tracks).filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.artist || "").toLowerCase().includes(q) ||
      t.filename.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;

    if (sortField === "title") comparison = a.title.localeCompare(b.title);
    else if (sortField === "artist")
      comparison = (a.artist || "").localeCompare(b.artist || "");
    else if (sortField === "bpm") comparison = (a.bpm ?? 0) - (b.bpm ?? 0);
    else if (sortField === "key")
      comparison = (a.key || "").localeCompare(b.key || "");
    else if (sortField === "duration") comparison = a.duration - b.duration;

    return sortAscending ? comparison : -comparison;
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <span className="sort-icon sort-icon--inactive">↕</span>;
    return sortAscending ? (
      <span className="sort-icon sort-icon--active">▲</span>
    ) : (
      <span className="sort-icon sort-icon--active">▼</span>
    );
  };

  const rowRenderer = useCallback(
    ({ index, style }) => {
      const track = sorted[index];
      return (
        <div style={style}>
          <TrackRow
            track={track}
            onLoadToDeck={onLoadToDeck}
            onContextMenu={(e) =>
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                track,
              })
            }
          />
        </div>
      );
    },
    [sorted, onLoadToDeck]
  );

  return (
    <div className="vw-browser">
      {/* HEADER */}
      <div className="browser-header">
        <h2>TRACK LIBRARY</h2>
        <SearchBar
          ref={searchInputRef}
          value={searchQuery}
          onChange={(val) => setSearchQuery(val)}
        />
      </div>

      {/* MAIN GRID */}
      <div className="browser-three-section-container">
        {/* LEFT SIDEBAR */}
        <div className="browser-column-panel">
          <h4>File System</h4>
          <button className="browser-btn" onClick={openFolder}>
            Import Folder
          </button>

          <h4>Crates</h4>
          {crates.map((c) => (
            <div key={c.id} className="browser-nav-item">
              📁 {c.name}
            </div>
          ))}

          <PlaylistPanel playlists={playlists} />
        </div>

        {/* CENTER TABLE (Virtualized) */}
        <div className="browser-column-panel browser-center-panel">
          <table className="browser-table-wrapper">
            <thead>
              <tr>
                <th onClick={() => handleSort("title")}>
                  Title {renderSortIcon("title")}
                </th>
                <th onClick={() => handleSort("artist")}>
                  Artist {renderSortIcon("artist")}
                </th>
                <th onClick={() => handleSort("bpm")}>
                  BPM {renderSortIcon("bpm")}
                </th>
                <th onClick={() => handleSort("key")}>
                  Key {renderSortIcon("key")}
                </th>
                <th onClick={() => handleSort("duration")}>
                  Dur {renderSortIcon("duration")}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
          </table>

          <Virtuoso
            style={{ height: window.innerHeight - 200 }}
            totalCount={sorted.length}
            itemContent={(index) => {
              const track = sorted[index];
              return (
                <TrackRow
                  track={track}
                  onLoadToDeck={onLoadToDeck}
                  onContextMenu={(e) =>
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      track,
                    })
                  }
                />
              );
            }}
          />
        </div>
        
        {/* RIGHT SIDEBAR */}
        <div className="browser-column-panel browser-automix-panel">
          <AutomixPanel />
        </div>
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (
        <BrowserContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          track={contextMenu.track}
          onClose={() => setContextMenu(null)}
          onLoadToDeck={onLoadToDeck}
        />
      )}
    </div>
  );
};

export default BrowserPanel;
