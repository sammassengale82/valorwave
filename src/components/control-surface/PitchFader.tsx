import React, { useState, useEffect } from "react";
import "../../styles/pitchfader.css";

interface PitchFaderProps {
  deckId: number;
  tempo: number; // current tempo ratio (1.0 = normal)
  onChange: (ratio: number) => void;
}

const PitchFader: React.FC<PitchFaderProps> = ({ deckId, tempo, onChange }) => {
  const [value, setValue] = useState<number>(tempo);

  useEffect(() => {
    setValue(tempo);
  }, [tempo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    setValue(newVal);
    onChange(newVal);
  };

  const percent = ((value - 1) * 100).toFixed(1);

  return (
    <div className="pitchfader-root">
      <div className="pitchfader-header">
        <span className="pitchfader-label">Pitch</span>
        <span className="pitchfader-deck">Deck {deckId}</span>
      </div>

      <div className="pitchfader-slider-wrap">
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.001}
          value={value}
          onChange={handleChange}
          className="pitchfader-slider"
        />

        <div className="pitchfader-ticks">
          {Array.from({ length: 11 }).map((_, i) => (
            <span key={i} className="pitchfader-tick" />
          ))}
        </div>
      </div>

      <div className="pitchfader-value">{percent}%</div>
    </div>
  );
};

export default PitchFader;
