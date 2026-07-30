import React from "react";
import { TrackMetadata } from "../../state/libraryState";
import "../../styles/playlistItem.css";

interface PlaylistItemProps {
  track: TrackMetadata;
  index: number;
  onLoadDeck1: () => void;
  onLoadDeck2: () => void;
  onPlayNext: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({
  track,
  index,
  onLoadDeck1,
  onLoadDeck2,
  onPlayNext,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  return (
    <div className="pl-item">
      {/* LEFT: Metadata */}
      <div className="pl-main">
        <div className="pl-title">{track.title}</div>
        <div className="pl-artist">{track.artist}</div>

        <div className="pl-meta">
          {track.bpm && <span className="pl-badge bpm">{track.bpm} BPM</span>}
          {track.key && <span className="pl-badge key">{track.key}</span>}
          <span className="pl-badge dur">
            {Math.round(track.duration)}s
          </span>
        </div>
      </div>

      {/* CENTER: Actions */}
      <div className="pl-actions">
        <button className="pl-btn deck1" onClick={onLoadDeck1}>
          Deck 1
        </button>
        <button className="pl-btn deck2" onClick={onLoadDeck2}>
          Deck 2
        </button>
        <button className="pl-btn next" onClick={onPlayNext}>
          Next
        </button>
        <button className="pl-btn remove" onClick={onRemove}>
          Remove
        </button>
      </div>

      {/* RIGHT: Reorder */}
      <div className="pl-reorder">
        <button className="pl-reorder-btn" onClick={onMoveUp} disabled={isFirst}>
          ↑
        </button>
        <button className="pl-reorder-btn" onClick={onMoveDown} disabled={isLast}>
          ↓
        </button>
      </div>
    </div>
  );
};

export default PlaylistItem;
