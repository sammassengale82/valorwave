// src/components/control-surface/BeatgridEditor.tsx
import React, { useState } from "react";
import { useBeatgridState } from "../../state/beatgridState";
import { audioEngine } from "../../engine/audioEngine";
import "../../styles/beatgrid.css";

interface BeatgridEditorProps {
  deckId: number;
}

export const BeatgridEditor: React.FC<BeatgridEditorProps> = ({ deckId }) => {
  const { shiftGrid, tightenGrid } = useBeatgridState();
  const [lastAction, setLastAction] = useState<string>("");

  const applyShift = async (direction: -1 | 1) => {
    // Frontend visual shift (10ms)
    shiftGrid(deckId, direction * 0.01);

    // Engine shift (full beat phase)
    try {
      await audioEngine.shiftBeat?.(deckId, direction);
      setLastAction(direction === -1 ? "Shifted Left" : "Shifted Right");
    } catch (err) {
      console.error("Beatgrid shift failure:", err);
      setLastAction("Shift Error");
    }
  };

  const applyTighten = async () => {
    tightenGrid(deckId);

    try {
      await audioEngine.tightenBeat?.(deckId);
      setLastAction("Grid Tightened");
    } catch (err) {
      console.error("Beatgrid tighten failure:", err);
      setLastAction("Tighten Error");
    }
  };

  return (
    <div className="beatgrid-editor">
      <div className="beatgrid-header">
        <span className="beatgrid-title">Beatgrid Tools — Deck {deckId}</span>
      </div>

      <div className="beatgrid-controls">
        <button
          className="beatgrid-btn"
          onClick={() => applyShift(-1)}
          aria-label="Shift beatgrid earlier"
        >
          ← Shift
        </button>

        <button
          className="beatgrid-btn"
          onClick={() => applyShift(1)}
          aria-label="Shift beatgrid later"
        >
          Shift →
        </button>

        <button
          className="beatgrid-btn tighten"
          onClick={applyTighten}
          aria-label="Tighten beatgrid"
        >
          Tighten
        </button>
      </div>

      <div className="beatgrid-status">
        {lastAction && <span>{lastAction}</span>}
      </div>
    </div>
  );
};

export default BeatgridEditor;
