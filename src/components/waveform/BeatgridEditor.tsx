// src/components/waveform/BeatgridEditor.tsx
import React, { useState } from "react";
import { audioEngine } from "../../engine/audioEngine";
import "../../styles/beatgrid.css";

interface BeatgridEditorProps {
  deckId: number;
}

const BeatgridEditor: React.FC<BeatgridEditorProps> = ({ deckId }) => {
  const grid = audioEngine.getBeatgrid(deckId);

  const [bpm, setBpm] = useState<number>(grid?.bpm ?? 120);
  const [firstBeat, setFirstBeat] = useState<number>(
    grid?.first_beat_sec ?? 0
  );

  const applyBeatgrid = () => {
    const duration = audioEngine.getDuration(deckId);
    if (!duration) return;

    const beatInterval = 60 / bpm;
    const beats: number[] = [];

    let t = firstBeat;
    while (t < duration) {
      beats.push(t);
      t += beatInterval;
    }

    const newGrid = {
      bpm,
      first_beat_sec: firstBeat,
      beats,
    };

    audioEngine.setBeatgrid(deckId, newGrid);
    window.dispatchEvent(
      new CustomEvent("beatgrid:updated", {
        detail: { deckId, grid: newGrid },
      })
    );
  };

  const shiftGrid = (amount: number) => {
    if (!grid) return;
    const newGrid = {
      ...grid,
      first_beat_sec: grid.first_beat_sec + amount,
      beats: grid.beats.map((b: number) => b + amount),
    };
    audioEngine.setBeatgrid(deckId, newGrid);
    window.dispatchEvent(
      new CustomEvent("beatgrid:updated", {
        detail: { deckId, grid: newGrid },
      })
    );
    setFirstBeat(newGrid.first_beat_sec);
  };

  const stretchGrid = (ratio: number) => {
    if (!grid) return;
    const newBpm = grid.bpm * ratio;
    setBpm(newBpm);

    const duration = audioEngine.getDuration(deckId);
    if (!duration) return;

    const beatInterval = 60 / newBpm;

    const beats: number[] = [];
    let t = grid.first_beat_sec;
    while (t < duration) {
      beats.push(t);
      t += beatInterval;
    }

    const newGrid = {
      bpm: newBpm,
      first_beat_sec: grid.first_beat_sec,
      beats,
    };

    audioEngine.setBeatgrid(deckId, newGrid);
    window.dispatchEvent(
      new CustomEvent("beatgrid:updated", {
        detail: { deckId, grid: newGrid },
      })
    );
  };

  return (
    <div className="beatgrid-editor">
      <h3>Beatgrid Editor (Deck {deckId})</h3>

      <div className="beatgrid-row">
        <label>BPM</label>
        <input
          type="number"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
        />
      </div>

      <div className="beatgrid-row">
        <label>First Beat (sec)</label>
        <input
          type="number"
          value={firstBeat}
          onChange={(e) => setFirstBeat(Number(e.target.value))}
        />
      </div>

      <button className="beatgrid-apply" onClick={applyBeatgrid}>
        Apply Beatgrid
      </button>

      <div className="beatgrid-shift">
        <button onClick={() => shiftGrid(-0.01)}>Shift -10ms</button>
        <button onClick={() => shiftGrid(0.01)}>Shift +10ms</button>
        <button onClick={() => shiftGrid(-0.05)}>Shift -50ms</button>
        <button onClick={() => shiftGrid(0.05)}>Shift +50ms</button>
      </div>

      <div className="beatgrid-stretch">
        <button onClick={() => stretchGrid(0.99)}>Stretch -1%</button>
        <button onClick={() => stretchGrid(1.01)}>Stretch +1%</button>
      </div>
    </div>
  );
};

export default BeatgridEditor;
