import React from "react";
import { SingerProfile } from "../../state/singerState";
import "../../styles/singerStats.css";

interface Props {
  singer: SingerProfile;
}

export const SingerStatsPanel: React.FC<Props> = ({ singer }) => {
  const history = singer.performanceHistory;

  // Count songs
  const songCounts: Record<string, number> = {};
  history.forEach((h) => {
    songCounts[h.song] = (songCounts[h.song] || 0) + 1;
  });

  const mostSungSong =
    Object.entries(songCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  // Extract artists
  const artistCounts: Record<string, number> = {};
  history.forEach((h) => {
    const parts = h.song.split(" - ");
    if (parts.length > 1) {
      const artist = parts[0].trim();
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;
    }
  });

  const mostSungArtist =
    Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  const totalPerformances = history.length;
  const avgWaitMin = Math.round(singer.stats.averageWaitMs / 60000);
  const lastSung = singer.stats.lastSungAt
    ? new Date(singer.stats.lastSungAt).toLocaleString()
    : "Never";

  return (
    <div className="ss-panel">
      <h2 className="ss-title">Singer Analytics</h2>

      <div className="ss-row">
        <strong>Most Sung Song:</strong>
        <span className="ss-value">{mostSungSong}</span>
      </div>

      <div className="ss-row">
        <strong>Most Sung Artist:</strong>
        <span className="ss-value">{mostSungArtist}</span>
      </div>

      <div className="ss-row">
        <strong>Total Performances:</strong>
        <span className="ss-value">{totalPerformances}</span>
      </div>

      <div className="ss-row">
        <strong>Average Wait Time:</strong>
        <span className="ss-value">{avgWaitMin} minutes</span>
      </div>

      <div className="ss-row">
        <strong>Last Sung:</strong>
        <span className="ss-value">{lastSung}</span>
      </div>
    </div>
  );
};
