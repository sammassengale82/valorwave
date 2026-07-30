// src/components/waveform/WaveformOverview.tsx
import React, { useRef, useEffect } from "react";

interface WaveformOverviewProps {
  peaks: Float32Array;
  scroll: number;
  onScrollChange: (s: number) => void;
}

const WaveformOverview: React.FC<WaveformOverviewProps> = ({
  peaks,
  scroll,
  onScrollChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = 40;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0af";

    const len = peaks.length;
    for (let x = 0; x < canvas.width; x++) {
      const idx = Math.floor((x / canvas.width) * len);
      const v = peaks[idx] ?? 0;
      const h = v * canvas.height;
      ctx.fillRect(x, canvas.height - h, 1, h);
    }

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    const winWidth = canvas.width * 0.2;
    const winX = scroll * (canvas.width - winWidth);
    ctx.strokeRect(winX, 0, winWidth, canvas.height);
  }, [peaks, scroll]);

  const onMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const s = x / rect.width;
    onScrollChange(Math.min(1, Math.max(0, s)));
  };

  return(
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: 40,
        background: "#111",
        borderRadius: 4,
      }}
      onMouseDown={onMouseDown}
    />
    );
  }
export default WaveformOverview;
