import React, { ChangeEvent } from "react";
import "../../styles/Crossfader.css";

export const Crossfader: React.FC<{
  value: number;
  onChange: (v: number) => void;
}> = ({ value, onChange }) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const handleDoubleClick = () => {
    onChange(0);
  };

  // Dynamic glow and layout percentages
  const glow = Math.abs(value) > 2 ? 0.8 : 0;
  const fill = `${50 + value}%`;

  return (
    <div className="crossfader-track-wrapper">
      {/* Manual tick marks */}
      <div className="crossfader-ticks">
        <span className="tick far-left"></span>
        <span className="tick side-left"></span>
        <span className="tick center-left"></span>
        <span className="tick center-line"></span>
        <span className="tick center-right"></span>
        <span className="tick side-right"></span>
        <span className="tick far-right"></span>
      </div>

      {/* NEW: Dedicated Visual Track Layer for Outward Symmetrical Glow */}
      <div 
        className="crossfader-glow-track" 
        style={{
          "--crossfader-fill": fill,
          "--thumb-glow": glow
        } as React.CSSProperties}
      />

      {/* Slider Input */}
      <input
        type="range"
        min={-50}
        max={50}
        value={value}
        onChange={handleChange}
        onDoubleClick={handleDoubleClick}
        className="crossfader-input"
        aria-label="DJ Crossfader"
        style={{
          "--thumb-glow": glow
        } as React.CSSProperties}
      />
    </div>
  );
};

export default Crossfader;
