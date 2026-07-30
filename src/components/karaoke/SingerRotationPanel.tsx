import React, { useEffect, useState } from "react";
import { useSingerRotation } from "../../hooks/useSingerRotation";
import { useSingerState } from "../../state/singerState";
import "../../styles/singerRotation.css";

type HistoryEntry = {
  singer: string;
  song: string;
  timestamp: number;
};

const SingerRotationPanel: React.FC = () => {
  const {
    addSinger,
    removeSinger,
    nextSinger,
    peekNextSinger,
    getHistory,
    clearHistory,
    refreshSingers,
  } = useSingerRotation();

  const singers = useSingerState((s) => s.singers);

  const [name, setName] = useState("");
  const [nextUp, setNextUp] = useState<any>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    (async () => {
      await refreshSingers();

      setNextUp(await peekNextSinger());

      const raw = await getHistory();
      setHistory(Array.isArray(raw) ? (raw as HistoryEntry[]) : []);
    })();
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addSinger(name.trim());
    setName("");
    setNextUp(await peekNextSinger());
  };

  const handleRemove = async (id: number) => {
    await removeSinger(id);
    setNextUp(await peekNextSinger());
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
  };

  return (
    <div className="sr-panel">
      {/* Header */}
      <div className="sr-header">
        <h3 className="sr-title">Singer Rotation</h3>
        <div className="sr-next">
          Next Up: <span>{nextUp ? nextUp.name : "None"}</span>
        </div>
        <button className="sr-next-btn" onClick={nextSinger}>
          Next Singer
        </button>
      </div>

      {/* Add Singer */}
      <div className="sr-add">
        <input
          className="sr-input"
          placeholder="Add singer name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="sr-add-btn" onClick={handleAdd}>
          Add
        </button>
      </div>

      {/* Singer List */}
      <div className="sr-list">
        {singers.map((s) => (
          <div key={s.id} className="sr-row">
            <div className="sr-name">{s.name}</div>

            <div className="sr-stats">
              Requests: {s.request_count} • Sung: {s.sung_count}
              {s.requested_song && (
                <span className="sr-song"> • Song: {s.requested_song}</span>
              )}
            </div>

            <button
              className="sr-remove-btn"
              onClick={() => handleRemove(Number(s.id))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="sr-history">
        <h3 className="sr-history-title">History</h3>

        {history.length === 0 && (
          <div className="sr-history-empty">No songs sung yet.</div>
        )}

        {history.map((h, i) => (
          <div key={i} className="sr-history-row">
            <div className="sr-history-singer">{h.singer}</div>
            <div className="sr-history-song">{h.song}</div>
            <div className="sr-history-time">
              {new Date(h.timestamp * 1000).toLocaleTimeString()}
            </div>
          </div>
        ))}

        {history.length > 0 && (
          <button className="sr-clear-history-btn" onClick={handleClearHistory}>
            Clear History
          </button>
        )}
      </div>
    </div>
  );
};

export default SingerRotationPanel;
