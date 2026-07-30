import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Virtuoso } from "react-virtuoso";

import { useLibraryState, TrackMetadata } from "../../state/libraryState";
import { audioEngine } from "../../engine/audioEngine";
import { DeckId } from "../../types/DeckId";

import TrackRow from "./TrackRow";
import BrowserContextMenu from "./BrowserContextMenu";

import "../../styles/trackbrowser.css";

const deckIds: DeckId[] = [1, 2, 3, 4];

type SortField = "title" | "artist" | "bpm" | "key" | "duration";

export const TrackBrowser: React.FC = () => {
  const tracksMap = useLibraryState((s) => s.tracks);
  const searchQuery = useLibraryState((s) => s.searchQuery);
  const setSearchQuery = useLibraryState((s) => s.setSearchQuery);
  const addToPlayNext = useLibraryState((s) => s.addToPlayNext);

  const [selectedDeck, setSelectedDeck] = useState<DeckId>(1);
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortAscending, setSortAscending] = useState(true);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    track: TrackMetadata | null;
  } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);

  const tracks = useMemo(() => Object.values(tracksMap), [tracksMap]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return tracks;

    return tracks.filter((t) => {
      return (
        t.title.toLowerCase().includes(q) ||
        (t.artist || "").toLowerCase().includes(q) ||
        t.filename.toLowerCase().includes(q)
      );
    });
  }, [tracks, searchQuery]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;

      switch (sortField) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "artist":
          cmp = (a.artist || "").localeCompare(b.artist || "");
          break;
        case "bpm":
          cmp = (a.bpm ?? 0) - (b.bpm ?? 0);
          break;
        case "key":
          cmp = (a.key ?? "").localeCompare(b.key ?? "");
          break;
        case "duration":
          cmp = (a.duration ?? 0) - (b.duration ?? 0);
          break;
      }

      return sortAscending ? cmp : -cmp;
    });
  }, [filtered, sortField, sortAscending]);

  useEffect(() => {
    if (!selectedTrackId && sorted.length > 0) {
      setSelectedTrackId(sorted[0].id);
    }
  }, [sorted, selectedTrackId]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAscending((prev) => !prev);
    } else {
      setSortField(field);
      setSortAscending(true);
    }
  };

  const handleLoadToDeck = useCallback(
    async (track: TrackMetadata) => {
      await audioEngine.loadTrack(selectedDeck, track.path, track.cdgPath);
    },
    [selectedDeck]
  );

  const handleRowClick = (trackId: string) => {
    setSelectedTrackId(trackId);
  };

  const handleRowDoubleClick = (track: TrackMetadata) => {
    setSelectedTrackId(track.id);
    void handleLoadToDeck(track);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!sorted.length) return;
    if (!selectedTrackId) return;

    const idx = sorted.findIndex((t) => t.id === selectedTrackId);
    if (idx === -1) return;

    if (e.key === "ArrowDown") {
      const next = sorted[Math.min(sorted.length - 1, idx + 1)];
      setSelectedTrackId(next.id);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      const prev = sorted[Math.max(0, idx - 1)];
      setSelectedTrackId(prev.id);
      e.preventDefault();
    } else if (e.key === "Enter") {
      const track = sorted[idx];
      void handleLoadToDeck(track);
      e.preventDefault();
    } else if (e.key.toLowerCase() === "n") {
      const track = sorted[idx];
      addToPlayNext(track.id);
      e.preventDefault();
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <span className="tb-sort-icon tb-sort-inactive">↕</span>;
    return (
      <span className="tb-sort-icon tb-sort-active">
        {sortAscending ? "▲" : "▼"}
      </span>
    );
  };

  const rowRenderer = ({ index, style }: any) => {
    const track = sorted[index];
    const isSelected = track.id === selectedTrackId;

    return (
      <div style={style}>
        <TrackRow
          track={track}
          onLoadToDeck={(deckId, path, cdgPath) =>
            audioEngine.loadTrack(deckId, path, cdgPath)
          }
          onContextMenu={(e) =>
            setContextMenu({
              x: e.clientX,
              y: e.clientY,
              track,
            })
          }
        />
        {isSelected && <div className="tb-selected-overlay" />}
      </div>
    );
  };

  return (
    <div
      className="tb-root"
      ref={rootRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* HEADER */}
      <div className="tb-header">
        <span className="tb-title">Track Browser</span>

        <input
          className="tb-search"
          placeholder="Filter database…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <div className="tb-target">
          <span>Target:</span>
          <select
            className="tb-deck-select"
            value={selectedDeck}
            onChange={(e) =>
              setSelectedDeck(Number(e.target.value) as DeckId)
            }
          >
            {deckIds.map((id) => (
              <option key={id} value={id}>
                Deck {id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE HEADER */}
      <div className="tb-header-row">
        <div onClick={() => handleSort("title")}>
          TITLE {renderSortIcon("title")}
        </div>
        <div onClick={() => handleSort("artist")}>
          ARTIST {renderSortIcon("artist")}
        </div>
        <div onClick={() => handleSort("bpm")}>
          BPM {renderSortIcon("bpm")}
        </div>
        <div onClick={() => handleSort("key")}>
          KEY {renderSortIcon("key")}
        </div>
        <div onClick={() => handleSort("duration")}>
          DUR {renderSortIcon("duration")}
        </div>
        <div className="tb-actions-col">ACTIONS</div>
      </div>

      {/* VIRTUALIZED LIST */}
      <Virtuoso
        style={{ height: window.innerHeight - 240 }}
        totalCount={sorted.length}
        itemContent={(index) => {
          const track = sorted[index];
          const isSelected = track.id === selectedTrackId;

          return (
            <div>
              <TrackRow
                track={track}
                onLoadToDeck={(deckId, path, cdgPath) =>
                  audioEngine.loadTrack(deckId, path, cdgPath)
                }
                onContextMenu={(e) =>
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    track,
                  })
                }
              />

              {isSelected && <div className="tb-selected-overlay" />}
            </div>
          );
        }}
      />

      {sorted.length === 0 && (
        <div className="tb-empty">No tracks match your search.</div>
      )}

      {/* CONTEXT MENU */}
      {contextMenu && (
        <BrowserContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          track={contextMenu.track}
          onClose={() => setContextMenu(null)}
          onLoadToDeck={(deckId, path, cdgPath) =>
            audioEngine.loadTrack(deckId, path, cdgPath)
          }
        />
      )}
    </div>
  );
};

export default TrackBrowser;
