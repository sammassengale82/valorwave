import React from "react";
import { SingerProfile } from "../../state/singerState";
import "../../styles/singerHistory.css";

interface Props {
  singer: SingerProfile;
}

export const SingerHistoryPanel: React.FC<Props> = ({ singer }) => {
  const history = [...singer.performanceHistory].sort(
    (a, b) => b.date - a.date
  );

  return (
    <div className="sh-panel">
      <h2 className="sh-title">Performance History</h2>

      {history.length === 0 && (
        <p className="sh-empty">No performances yet.</p>
      )}

      {history.map((entry, i) => (
        <div key={i} className="sh-item">
          <div className="sh-song">{entry.song}</div>
          <div className="sh-date">
            {new Date(entry.date).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};
