import React, { useRef } from "react";
import { useSamplerState } from "../../state/samplerState";
import { useSamplerEngine } from "../../hooks/useSamplerEngine";

interface Props {
  id: number;
}

const SamplerPad: React.FC<Props> = ({ id }) => {
  const pad = useSamplerState((s) => s.pads.find((p) => p.id === id));
  const setPadFile = useSamplerState((s) => s.setPadFile);
  const setPadVolume = useSamplerState((s) => s.setPadVolume);
  const setPadPitch = useSamplerState((s) => s.setPadPitch);
  const togglePadLoop = useSamplerState((s) => s.togglePadLoop);

  const { loadPad, triggerPad } = useSamplerEngine();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!pad) return null;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPadFile(id, file);
      await loadPad(id, file);
    }
  }

  return (
    <div className="sampler-pad">
      <button
        className="pad-trigger"
        onClick={() => triggerPad(id)}
      >
        {pad.name}
      </button>

      <input
        type="file"
        accept="audio/*"
        ref={fileInputRef}
        onChange={handleFile}
        style={{ display: "none" }}
      />

      <button onClick={() => fileInputRef.current?.click()}>
        Load
      </button>

      <div className="pad-controls">
        <label>Vol</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={pad.volume}
          onChange={(e) => setPadVolume(id, Number(e.target.value))}
        />

        <label>Pitch</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.01"
          value={pad.pitch}
          onChange={(e) => setPadPitch(id, Number(e.target.value))}
        />

        <label>Loop</label>
        <input
          type="checkbox"
          checked={pad.loop}
          onChange={() => togglePadLoop(id)}
        />
      </div>
    </div>
  );
};

export default SamplerPad;
