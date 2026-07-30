// src/components/control-surface/StemsPanel.tsx
import React from "react";
import { useStemsState } from "../../state/stemsState";
import { audioEngine } from "../../engine/audioEngine";

interface StemsPanelProps {
  deckId: number;
}

const StemsPanel: React.FC<StemsPanelProps> = ({ deckId }) => {
  const stems = useStemsState((s) => s.stems.find((st) => st.deckId === deckId));
  const setVolume = useStemsState((s) => s.setVolume);
  const toggleMute = useStemsState((s) => s.toggleMute);
  const setSolo = useStemsState((s) => s.setSolo);

  if (!stems) return null;

  function pushToEngine() {
    const gains = {
      vocal: stems.vocal,
      drums: stems.drums,
      bass: stems.bass,
      other: stems.other,
    };

    audioEngine.updateStems(deckId, true, gains);
  }

  const renderStem = (label: string, key: "vocal" | "drums" | "bass" | "other") => (
    <div className="stem-row">
      <strong>{label}</strong>

      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={stems[key]}
        onChange={(e) => {
          setVolume(deckId, key, Number(e.target.value));
          pushToEngine();
        }}
      />

      <button
        onClick={() => {
          toggleMute(deckId, key);
          pushToEngine();
        }}
      >
        M
      </button>

      <button
        onClick={() => {
          setSolo(deckId, key);
          pushToEngine();
        }}
      >
        S
      </button>
    </div>
  );

  return (
    <div className="stems-panel">
      <h4>Stems</h4>
      {renderStem("Vocals", "vocal")}
      {renderStem("Drums", "drums")}
      {renderStem("Bass", "bass")}
      {renderStem("Other", "other")}
    </div>
  );
};

export default StemsPanel;
