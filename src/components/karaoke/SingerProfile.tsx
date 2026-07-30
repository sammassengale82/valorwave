import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

import SingerNotesEditor from "./SingerNotesEditor";
import FavoriteSongsManager from "./FavoriteSongsManager";
import PerformanceHistoryPanel from "./PerformanceHistoryPanel";
import "../../styles/singerProfile.css";

interface Props {
  singerId: number;
}

export default function SingerProfile({ singerId }: Props) {
  const [profile, setProfile] = useState<any>(null);

  async function refresh() {
    if (!singerId) return;
    const data = await invoke("get_singer_profile", { id: singerId });
    setProfile(data);
  }

  useEffect(() => {
    refresh();
  }, [singerId]);

  if (!profile) {
    return <div className="sp-panel sp-empty">No singer selected</div>;
  }

  const stats = profile.stats;
  const history = profile.performanceHistory;

  const avgPitch = (stats.avgPitch * 100).toFixed(1);
  const avgTiming = (stats.avgTiming * 100).toFixed(1);
  const score = (((stats.avgPitch + stats.avgTiming) / 2) * 100).toFixed(1);

  return (
    <div className="sp-panel">
      {/* Header */}
      <h2 className="sp-name">{profile.name}</h2>

      {profile.notes && (
        <p className="sp-notes">"{profile.notes}"</p>
      )}

      {/* Notes Editor */}
      <SingerNotesEditor singerId={profile.id} />

      {/* Stats */}
      <section className="sp-section">
        <h3 className="sp-section-title">Stats</h3>

        <div className="sp-grid">
          <div className="sp-box">
            <label>Total Songs Sung</label>
            <div className="sp-value">{stats.totalSongsSung}</div>
          </div>

          <div className="sp-box">
            <label>Average Pitch</label>
            <div className="sp-value">{avgPitch}%</div>
          </div>

          <div className="sp-box">
            <label>Average Timing</label>
            <div className="sp-value">{avgTiming}%</div>
          </div>

          <div className="sp-box">
            <label>Best Song</label>
            <div className="sp-value">{stats.bestSong || "None"}</div>
          </div>
        </div>
      </section>

      {/* Favorite Songs */}
      <FavoriteSongsManager
        singerId={profile.id}
        favoriteSongs={profile.favoriteSongs}
        onUpdated={refresh}
      />

      {/* Analytics */}
      <section className="sp-section">
        <h3 className="sp-section-title">Analytics</h3>

        {history.length === 0 ? (
          <p className="sp-empty">Not enough data yet.</p>
        ) : (
          <>
            <div className="sp-grid">
              <div className="sp-box">
                <label>Performance Score</label>
                <div className="sp-value">{score}</div>
              </div>

              <div className="sp-box">
                <label>Pitch Trend</label>
                <div className="sp-value">{avgPitch}%</div>
              </div>

              <div className="sp-box">
                <label>Timing Trend</label>
                <div className="sp-value">{avgTiming}%</div>
              </div>
            </div>

            <h4 className="sp-subtitle">Recent Performances</h4>
            <ul className="sp-history-list">
              {history.slice(-5).map((entry, i) => (
                <li key={i} className="sp-history-item">
                  <strong>{entry.song}</strong>
                  <div className="sp-history-date">
                    Pitch: {(entry.pitch * 100).toFixed(1)}% — Timing:{" "}
                    {(entry.timing * 100).toFixed(1)}%
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Full History */}
      <PerformanceHistoryPanel history={history} />
    </div>
  );
}
