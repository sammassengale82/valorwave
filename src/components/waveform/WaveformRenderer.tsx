// src/components/waveform/WaveformRenderer.tsx
import React, { useEffect, useRef, useState } from "react";
import { audioEngine } from "../../engine/audioEngine";
import { useHotCueState } from "../../state/hotCueState";

interface WaveformRendererProps {
  deckId: number;
}

const WaveformRenderer: React.FC<WaveformRendererProps> = ({ deckId }) => {
  const audio = audioEngine;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overviewRef = useRef<HTMLCanvasElement | null>(null);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [phaseOffset, setPhaseOffset] = useState(0);

  const cues = useHotCueState((s) =>
    s.cues.filter((c) => c.deckId === deckId && c.time !== null)
  );

  const addHotcue = async () => {
    const pos = Number(await audio.getPosition(deckId));
    useHotCueState.getState().addCue(deckId, pos);
  };

  const jumpToHotcue = (cue: { id: number; time: number; color: string }) => {
    audio.setPosition(deckId, cue.time);
  };

  useEffect(() => {
    const peaks = audio.getPeaks(deckId);
    const canvas = overviewRef.current;
    if (!canvas || !peaks) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const mid = h / 2;

    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x < w; x++) {
      const idx = Math.floor((x / w) * peaks.length);
      const v = peaks[idx] ?? 0;
      const y = v * mid;
      ctx.moveTo(x, mid - y);
      ctx.lineTo(x, mid + y);
    }

    ctx.stroke();
  }, [deckId]);

  const drawWaveform = async () => {
    const peaks = audio.getPeaks(deckId);
    const beatgrid = audio.getBeatgrid(deckId);
    const canvas = canvasRef.current;

    if (!canvas || !peaks) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, width, height);

    const duration = Number(audio.getDuration(deckId));
    const pos = Number(await audio.getPosition(deckId));

    const windowDuration = duration / zoom;
    const windowStart = Math.max(0, pos - windowDuration / 2);
    const windowEnd = Math.min(duration, windowStart + windowDuration);

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();

    const len = peaks.length;
    for (let i = 0; i < len; i++) {
      const x = (i / len) * width;
      const v = peaks[i];
      const y = height / 2 - v * (height / 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "#0f0";
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < len; i++) {
      const t = (i / len) * duration;
      if (t < windowStart || t > windowEnd) continue;

      const norm = (t - windowStart) / (windowEnd - windowDuration);
      const x = norm * width;
      const v = peaks[i];
      const y = height / 2 - v * (height / 2);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    if (beatgrid) {
      ctx.strokeStyle = "#444";
      ctx.lineWidth = 1;

      const bpm = beatgrid.bpm;
      const beatInterval = 60 / bpm;

      for (let t = windowStart; t < windowEnd; t += beatInterval) {
        const norm = (t - windowStart) / (windowEnd - windowStart);
        const x = norm * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      const nearestBeatIndex = Math.round(pos / beatInterval);
      const beatPos = nearestBeatIndex * beatInterval;
      const offset = pos - beatPos;
      setPhaseOffset(offset);

      const normBeat = (beatPos - windowStart) / (windowEnd - windowStart);
      const beatX = normBeat * width;

      ctx.strokeStyle = "#ff00ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(beatX, 0);
      ctx.lineTo(beatX, height);
      ctx.stroke();
    }

    if (cues && cues.length > 0 && duration > 0) {
      ctx.save();
      ctx.lineWidth = 2;

      cues.forEach((cue) => {
        const norm = (cue.time - windowStart) / (windowEnd - windowStart);
        if (norm < 0 || norm > 1) return;

        const x = norm * width;

        ctx.strokeStyle = cue.color || "#ff0000";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(x - 16, 4, 32, 14);

        ctx.fillStyle = "#fff";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(cue.id), x, 11);
      });

      ctx.restore();
    }

    const normPlay = (pos - windowStart) / (windowEnd - windowStart);
    const playX = normPlay * width;

    ctx.strokeStyle = "#ff0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playX, 0);
    ctx.lineTo(playX, height);
    ctx.stroke();
  };

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail.deckId === deckId) {
        setZoom((z) => z + 0.0001);
      }
    };

    window.addEventListener("beatgrid:updated", handler);
    return () => window.removeEventListener("beatgrid:updated", handler);
  }, [deckId]);

  useEffect(() => {
    let frame: number;

    const tick = () => {
      void drawWaveform();
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [zoom, cues, deckId]);

  const scrub = async (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const duration = Number(audio.getDuration(deckId));
    const pos = Number(await audio.getPosition(deckId));

    const windowDuration = duration / zoom;
    const windowStart = Math.max(0, pos - windowDuration / 2);
    const windowEnd = Math.min(duration, windowStart + windowDuration);

    const newPos =
      windowStart + (x / canvas.width) * (windowEnd - windowStart);

    audio.setPosition(deckId, newPos);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsScrubbing(true);
    void scrub(e);
  };

  const handleMouseUp = () => setIsScrubbing(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isScrubbing) void scrub(e);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <canvas
        ref={overviewRef}
        width={800}
        height={40}
        style={{
          width: "100%",
          height: "40px",
          background: "#000",
          borderRadius: "6px",
        }}
      />

      <canvas
        ref={canvasRef}
        width={800}
        height={140}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{
          width: "100%",
          height: "140px",
          background: "#000",
          cursor: "pointer",
          borderRadius: "6px",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "#ccc",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={addHotcue}>Add Hotcue</button>
          {cues.map((cue) => (
            <button
              key={cue.id}
              onClick={() => jumpToHotcue(cue)}
              style={{
                background: cue.color,
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                color: "#000",
                fontWeight: "bold",
              }}
            >
              C{cue.id}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Zoom</span>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </div>

        <div>Phase offset: {phaseOffset.toFixed(3)}s</div>
      </div>
    </div>
  );
};

export default WaveformRenderer;
