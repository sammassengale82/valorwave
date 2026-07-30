import React from "react";

interface StemsSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const StemsSlider: React.FC<StemsSliderProps> = ({ label, value, onChange }) => {
  return (
    <div className="stems-slider">
      <span className="stems-slider-label">{label}</span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
};

export default StemsSlider;
