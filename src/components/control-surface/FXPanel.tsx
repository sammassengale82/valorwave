import React, { useState, useEffect } from "react";
import { Knob } from "react-rotary-knob";
import { audioEngine } from "../../engine/audioEngine";
import "../../styles/fxpanel.css";

interface FXPanelProps {
  deckId: number;
}

export default function FXPanel({ deckId }: FXPanelProps) {
  const [echo, setEcho] = useState(0);
  const [brake, setBrake] = useState(0);

  // Sync FX values when deck changes or engine updates
  useEffect(() => {
    const fx = audioEngine.getFXState(deckId);
    if (fx) {
      if (typeof fx.echo === "number") setEcho(fx.echo);
      if (typeof fx.brake === "number") setBrake(fx.brake);
    }
  }, [deckId]);

  const handleEcho = (val: number) => {
    setEcho(val);
    audioEngine.setFX(deckId, "echo", val);
  };

  const handleBrake = (val: number) => {
    setBrake(val);
    audioEngine.setFX(deckId, "brake", val);
  };

  const handleRoll = () => {
    audioEngine.setFX(deckId, "roll", 1);
  };

  return (
    <div className="fx-panel">
      <div className="fx-header">FX Controls</div>

      <div className="fx-knobs-row">

        {/* Echo */}
        <div className="fx-knob-group">
          <Knob
            min={0}
            max={1}
            step={0.01}
            value={echo}
            onChange={handleEcho}
            className="fx-knob"
          />
          <span className="fx-knob-label">Echo</span>
        </div>

        {/* Brake */}
        <div className="fx-knob-group">
          <Knob
            min={0}
            max={1}
            step={0.01}
            value={brake}
            onChange={handleBrake}
            className="fx-knob"
          />
          <span className="fx-knob-label">Brake</span>
        </div>

        {/* Roll */}
        <div className="fx-knob-group">
          <button className="fx-action-btn" onClick={handleRoll}>
            Roll
          </button>
        </div>

      </div>
    </div>
  );
}
