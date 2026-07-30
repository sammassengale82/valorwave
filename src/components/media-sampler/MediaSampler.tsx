import React from "react";
import "../../styles/mediaSampler.css";

const MediaSampler: React.FC = () => {
  return (
    <div className="ms-panel">
      <h2 className="ms-title">Media Sampler</h2>

      <p className="ms-subtitle">
        Sample pads and playback controls will appear here.
      </p>

      <div className="ms-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="ms-pad">
            <div className="ms-pad-label">Pad {i + 1}</div>
            <button className="ms-pad-btn">Trigger</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaSampler;
