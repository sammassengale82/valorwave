import React from "react";
import "../../styles/metadata_panel.css";

interface MetadataPanelProps {
  metadata: any;
  deckLabel: string;
}

const MetadataPanel: React.FC<MetadataPanelProps> = ({ metadata, deckLabel }) => {
  const title = metadata?.title ?? "No Track Loaded";
  const artist = metadata?.artist ?? "";
  const bpm = metadata?.bpm;
  const key = metadata?.key;

  return (
    <div className="metadata-panel">
      <div className="metadata-header">
        <span className="metadata-deck-badge">Deck {deckLabel}</span>
      </div>

      <div className="metadata-title">{title}</div>
      {artist && <div className="metadata-artist">{artist}</div>}

      <div className="metadata-fields">
        <div className="metadata-field">
          <span className="metadata-label">BPM</span>
          <span className="metadata-value">{bpm ?? "--"}</span>
        </div>

        <div className="metadata-field">
          <span className="metadata-label">Key</span>
          <span className="metadata-value">{key ?? "--"}</span>
        </div>
      </div>
    </div>
  );
};

export default MetadataPanel;
