import React, { useEffect, useState } from "react";
import { metadataEngine } from "../../engine/metadataEngine";
import "../../styles/wavepreview.css";

interface Props {
  path: string;
}

const WavePreview: React.FC<Props> = ({ path }) => {
  const [peaks, setPeaks] = useState<Float32Array | null>(null);

  useEffect(() => {
    let mounted = true;
    metadataEngine.generatePeaks(path).then((p) => {
      if (mounted) setPeaks(new Float32Array(p));
    });
    return () => {
      mounted = false;
    };
  }, [path]);

  if (!peaks) return <div className="wavepreview-loading">Loading…</div>;

  return (
    <canvas
      className="wavepreview-canvas"
      ref={(canvas) => {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = "#00aaff";
        ctx.lineWidth = 1;

        ctx.beginPath();
        for (let i = 0; i < w; i++) {
          const idx = Math.floor((i / w) * peaks.length);
          const val = peaks[idx] * h;
          ctx.moveTo(i, h / 2 - val / 2);
          ctx.lineTo(i, h / 2 + val / 2);
        }
        ctx.stroke();
      }}
      width={180}
      height={36}
    />
  );
};

export default WavePreview;
