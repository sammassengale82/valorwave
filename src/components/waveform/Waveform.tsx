// src/components/waveform/Waveform.tsx
import React, { useEffect, useRef, useState } from "react";
import { audioEngine } from "../../engine/audioEngine";

interface WaveformHotcue {
  pos: number;
  color: string;
}

interface WaveformProps {
  deckId: number;
  width?: number;
  height?: number;
  zoom?: number; // 1.0 = full track, 4.0 = zoomed in
  hotcues?: WaveformHotcue[];
}

const Waveform: React.FC<WaveformProps> = ({
  deckId,
  width = 800,
  height = 100,
  zoom = 1.0,
  hotcues = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overviewRef = useRef<HTMLCanvasElement | null>(null);

  const [scroll, setScroll] = useState(0); // 0 → start, 1 → end

  const peaks = audioEngine.getPeaks(deckId);
  const beatgrid = audioEngine.getBeatgrid(deckId);

  const drawOverview = () => {
    const canvas = overviewRef.current;
    if (!canvas || !peaks) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const mid = h / 2;

    ctx.strokeStyle = "#555";
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
  };

  const drawWaveform = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const mid = h / 2;

    const visibleSamples = Math.floor(peaks.length / zoom);
    const start = Math.floor(scroll * (peaks.length - visibleSamples));

    ctx.strokeStyle = "#0af";
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x < w; x++) {
      const idx = start + Math.floor((x / w) * visibleSamples);
      const v = peaks[idx] ?? 0;
      const y = v * mid;
      ctx.moveTo(x, mid - y);
      ctx.lineTo(x, mid + y);
    }

    ctx.stroke();

    // Beatgrid markers
    if (beatgrid?.beats) {
      ctx.strokeStyle = "#ff0";
      ctx.lineWidth = 1;

      beatgrid.beats.forEach((beatSec: number) => {
        const duration = audioEngine.getDuration(deckId);
        if (!duration) return;

        const pos = beatSec / duration;
        const rel = (pos - scroll) * zoom;
        if (rel >= 0 && rel <= 1) {
          const x = rel * w;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
      });
    }

    // Hotcues
    hotcues.forEach((hc) => {
      const duration = audioEngine.getDuration(deckId);
      if (!duration) return;

      const pos = hc.pos / duration;
      const rel = (pos - scroll) * zoom;
      if (rel >= 0 && rel <= 1) {
        const x = rel * w;
        ctx.fillStyle = hc.color;
        ctx.fillRect(x - 2, 0, 4, h);
      }
    });

    // Playhead
    const pos = Number(await audioEngine.getPosition(deckId));
    const duration = Number(audioEngine.getDuration(deckId));
    const rel = duration > 0 ? (pos / duration - scroll) * zoom : 0;
    if (rel >= 0 && rel <= 1) {
      const x = rel * w;
      ctx.fillStyle = "#fff";
      ctx.fillRect(x - 1, 0, 2, h);
    }
  };

  useEffect(() => {
    let raf: number;

    const loop = () => {
      drawWaveform();
      raf = requestAnimationFrame(loop);
    };

    drawOverview();
    loop();

    return () => cancelAnimationFrame(raf);
  }, [peaks, zoom, scroll]);

  const handleScroll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScroll(Number(e.target.value));
  };

  return (
    <div style={{ width }}>
      <canvas
        ref={overviewRef}
        width={width}
        height={40}
        style={{
          width,
          height: 40,
          background: "#000",
          borderRadius: "4px",
          marginBottom: "6px",
        }}
      />

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width,
          height,
          background: "#000",
          borderRadius: "4px",
        }}
      />

      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={scroll}
        onChange={handleScroll}
        style={{ width }}
      />
    </div>
  );
};

export default Waveform;
