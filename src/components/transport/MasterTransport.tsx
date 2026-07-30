import React from "react";

interface MasterTransportProps {
  bpm: number;
  playing: boolean;
  onPlayPause: () => void;
  onBpmChange: (value: number) => void;
  onCrossfader: (value: number) => void;
  crossfader: number;
}

export const MasterTransport: React.FC<MasterTransportProps> = ({
  bpm,
  playing,
  onPlayPause,
  onBpmChange,
  onCrossfader,
  crossfader,
}) => {
  return (
    <div className="master-transport">
      <button onClick={onPlayPause}>
        {playing ? "Pause" : "Play"}
      </button>

      <div className="bpm-control">
        <label>BPM</label>
        <input
          type="number"
          value={bpm}
          onChange={(e) => onBpmChange(parseFloat(e.target.value))}
        />
      </div>

      <div className="crossfader">
        <label>Crossfader</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={crossfader}
          onChange={(e) => onCrossfader(parseFloat(e.target.value))}
        />
      </div>
    </div>
  );
};
