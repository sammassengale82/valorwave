import React from "react";
import SamplerPad from "./SamplerPad";
import "../../styles/sampler.css";

const SamplerGrid: React.FC = () => {
  return (
    <div className="sampler-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <SamplerPad key={i} id={i + 1} />
      ))}
    </div>
  );
};

export default SamplerGrid;
