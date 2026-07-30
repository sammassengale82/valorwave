import React, { useState } from "react";
import { TrackMetadata } from "../../state/libraryState";
import WavePreview from "./WavePreview";
import "../../styles/trackrow.css";
import { audioEngine } from "../../engine/audioEngine";

interface Props {
  track: TrackMetadata;
  onLoadToDeck: (deckId: number, path: string, cdgPath?: string) => void;
  onContextMenu?: (e: React.MouseEvent, track: TrackMetadata) => void;
}

const TrackRow: React.FC<Props> = ({ track, onLoadToDeck, onContextMenu }) => {
  const [hover, setHover] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/valorwave-track", JSON.stringify(track));
  };

  const formatDuration = (secs?: number) => {
    if (typeof secs !== "number" || isNaN(secs)) return "--:--";
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${String(remainder).padStart(2, "0")}`;
  };

  const isPlaying =
    audioEngine.getDeckMetadata(1)?.path === track.path ||
    audioEngine.getDeckMetadata(2)?.path === track.path;

  return (
    <div
      className={`track-row ${isPlaying ? "track-row--playing" : ""}`}
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onContextMenu={(e) => onContextMenu?.(e, track)}
    >
      <div className="track-cell track-title">
        {track.is_karaoke ? "🎤" : "🎵"} {track.title}
      </div>

      <div className="track-cell track-artist">
        {track.artist || "Unknown Artist"}
      </div>

      <div className="track-cell track-bpm">
        {track.bpm ? track.bpm.toFixed(1) : "--"}
      </div>

      <div className="track-cell track-key">
        {track.key ? <span className="track-key-pill">{track.key}</span> : "--"}
      </div>

      <div className="track-cell track-duration">
        {formatDuration(track.duration)}
      </div>

      <div className="track-cell track-actions">
        <button
          className="track-load-btn"
          onClick={() => onLoadToDeck(1, track.path, track.cdgPath)}
        >
          D1
        </button>
        <button
          className="track-load-btn"
          onClick={() => onLoadToDeck(2, track.path, track.cdgPath)}
        >
          D2
        </button>
      </div>

      {hover && (
        <div className="track-wave-preview">
          <WavePreview path={track.path} />
        </div>
      )}
    </div>
  );
};

export default TrackRow;
