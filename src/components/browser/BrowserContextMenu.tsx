import React from "react";
import "../../styles/browser-contextmenu.css";

interface Props {
  x: number;
  y: number;
  track: any;
  onClose: () => void;
  onLoadToDeck: (deckId: number, path: string, cdgPath?: string) => void;
}

const BrowserContextMenu: React.FC<Props> = ({
  x,
  y,
  track,
  onClose,
  onLoadToDeck,
}) => {
  return (
    <div
      className="browser-contextmenu"
      style={{ left: x, top: y }}
      onMouseLeave={onClose}
    >
      <div
        className="browser-contextmenu-item"
        onClick={() => onLoadToDeck(1, track.path, track.cdgPath)}
      >
        Load to Deck 1
      </div>

      <div
        className="browser-contextmenu-item"
        onClick={() => onLoadToDeck(2, track.path, track.cdgPath)}
      >
        Load to Deck 2
      </div>

      <div className="browser-contextmenu-item">Add to Playlist…</div>
      <div className="browser-contextmenu-item">Add to Crate…</div>
      <div className="browser-contextmenu-item">Analyze Track</div>
      <div className="browser-contextmenu-item">Show in Explorer</div>
    </div>
  );
};

export default BrowserContextMenu;
