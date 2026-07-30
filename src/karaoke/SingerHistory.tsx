// src/screens/SingerHistory.tsx
import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "../styles/singer-history.css";

interface PerformanceEntry {
  song: string;
  pitch: number;
  timing: number;
  date?: string;
}

interface SingerStats {
  totalSongs: number;
  avgPitch: number;
  avgTiming: number;
  bestSong?: string;
  performanceHistory: PerformanceEntry[];
}

interface Props {
  deckId: number;
}

const SingerHistory: React.FC<Props> = ({ deckId }) => {
  const [stats, setStats] = useState<SingerStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const data = await invoke<SingerStats>("get_singer_stats", { deckId });
      setStats(data);
    } catch (e) {
      console.error("Failed to load singer stats:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [deckId]);

  if (loading) {
    return <div className="sh-root neon-border">Loading singer history…</div>;
  }

  if (!stats) {
    return (
      <div className="sh-root neon-border">
        <h3>Singer History</h3>
        <div className="sh-empty">No history available.</div>
      </div>
    );
  }

  return (
    <div className="sh-root neon-border">
      <h3 className="sh-header">Singer History</h3>

      {/* TOTAL SONGS */}
      <div className="sh-block">
        <strong>Total Songs Sung:</strong>
        <span className="sh-value">{stats.totalSongs}</span>
      </div>

      {/* AVG PITCH */}
      <div className="sh-block">
        <strong>Average Pitch Accuracy:</strong>
        <div className="sh-bar">
          <div
            className="sh-bar-fill"
            style={{ width: `${stats.avgPitch * 100}%` }}
          />
        </div>
        <span className="sh-percent">{(stats.avgPitch * 100).toFixed(1)}%</span>
      </div>

      {/* AVG TIMING */}
      <div className="sh-block">
        <strong>Average Timing Accuracy:</strong>
        <div className="sh-bar">
          <div
            className="sh-bar-fill"
            style={{ width: `${stats.avgTiming * 100}%` }}
          />
        </div>
        <span className="sh-percent">{(stats.avgTiming * 100).toFixed(1)}%</span>
      </div>

      {/* BEST SONG */}
      <div className="sh-block">
        <strong>Best Song:</strong>
        <span className="sh-value">{stats.bestSong || "None yet"}</span>
      </div>

      {/* PERFORMANCE HISTORY */}
      <h4 className="sh-subheader">Performance History</h4>

      <ul className="sh-history-list">
        {stats.performanceHistory.map((entry, i) => (
          <li key={i} className="sh-history-item neon-border">
            <div className="sh-history-title">
              <strong>{entry.song}</strong>
            </div>

            <div className="sh-history-stats">
              <span>Pitch: {(entry.pitch * 100).toFixed(1)}%</span>
              <span>Timing: {(entry.timing * 100).toFixed(1)}%</span>
            </div>

            {entry.date && (
              <div className="sh-history-date">
                {new Date(entry.date).toLocaleString()}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SingerHistory;
