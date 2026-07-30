import "../../styles/performanceHistory.css";

interface PerformanceEntry {
  song: string;
  pitch: number;
  timing: number;
  date: string | number | Date;
}

interface Props {
  history: PerformanceEntry[];
}

export default function PerformanceHistoryPanel({ history }: Props) {
  const hasHistory = history && history.length > 0;

  return (
    <div className="ph-panel">
      <h3 className="ph-title">Performance History</h3>

      {!hasHistory && (
        <p className="ph-empty">No performances yet.</p>
      )}

      {hasHistory && (
        <div className="ph-list">
          {history.map((entry, i) => (
            <div key={i} className="ph-item">
              <div className="ph-song">{entry.song}</div>

              <div className="ph-stats">
                <span className="ph-stat">
                  Pitch: {(entry.pitch * 100).toFixed(0)}%
                </span>
                <span className="ph-stat">
                  Timing: {(entry.timing * 100).toFixed(0)}%
                </span>
              </div>

              <div className="ph-date">
                {new Date(entry.date).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
