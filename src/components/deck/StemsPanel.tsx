import React, { useState } from "react";
import { Knob } from "react-rotary-knob";
import { audioEngine } from "../../engine/audioEngine";
import "../../styles/stems.css";

type StemsPanelProps = {
  deckId: number;
};

export default function StemsPanel({ deckId }: StemsPanelProps) {
  const [stems, setStems] = useState({
    vocal: 1,
    drums: 1,
    bass: 1,
    other: 1,
  });

  const handleStemChange = (key: keyof typeof stems, value: number) => {
    setStems((prev) => ({ ...prev, [key]: value }));
    audioEngine.setStemGain(deckId, key, value);
  };

  return (
    <div className="vw-stems-panel">
      <div className="vw-stems-header">Stems (Deck {deckId})</div>

      <div className="vw-stems-knob-row">
        {(["vocal", "drums", "bass", "other"] as const).map((stemKey) => (
          <div key={stemKey} className="vw-stems-knob-group">
            <Knob
              min={0}
              max={1}
              step={0.01}
              value={stems[stemKey]}
              onChange={(val) => handleStemChange(stemKey, val)}
              className="vw-stems-knob"
            />
            <span className="vw-stems-label">
              {stemKey.charAt(0).toUpperCase() + stemKey.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
