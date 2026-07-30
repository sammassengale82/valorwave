import React from "react";
import "../../styles/hostcontrols.css";

const HostControls: React.FC = () => {
  return (
    <div className="host-controls">
      <div className="host-header">Host Controls</div>

      <div className="host-grid">

        <button className="host-btn">
          🎙️ Mic Gain
        </button>

        <button className="host-btn">
          📣 Talkover
        </button>

        <button className="host-btn">
          💬 Crowd Request
        </button>

        <button className="host-btn">
          🎤 Singer Queue
        </button>

        <button className="host-btn">
          📊 Show Summary
        </button>

        <button className="host-btn">
          🏟️ Venue Mode
        </button>

      </div>
    </div>
  );
};

export default HostControls;
