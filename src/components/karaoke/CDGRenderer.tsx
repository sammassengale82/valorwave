import React, { useEffect, useState, useRef } from "react";
import { audioEngine } from "../../engine/audioEngine";
import "../../styles/cdgrenderer.css";

interface Props {
  deckId: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  fullscreen?: boolean;
}

export const CDGRenderer: React.FC<Props> = ({ deckId, canvasRef, fullscreen }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // Poll timeline
  useEffect(() => {
    let active = true;
    const interval = setInterval(async () => {
      const pos = await audioEngine.getPosition(deckId);
      const dur = audioEngine.getDuration(deckId);
      if (active) {
        setPosition(pos ?? 0);
        setDuration(dur ?? 0);
      }
    }, 250);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [deckId]);

  // Render loop
  useEffect(() => {
    let frame: number;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement("canvas");
    }
    const offscreen = offscreenCanvasRef.current;

    const renderLoop = async () => {
      const targetCanvas = canvasRef.current;
      if (!targetCanvas) {
        frame = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = targetCanvas.getContext("2d");
      if (!ctx) {
        frame = requestAnimationFrame(renderLoop);
        return;
      }

      try {
        const frameData = await audioEngine.getCDGFrame?.(deckId);

        if (frameData) {
          if (offscreen.width !== frameData.width || offscreen.height !== frameData.height) {
            offscreen.width = frameData.width;
            offscreen.height = frameData.height;
          }

          const offscreenCtx = offscreen.getContext("2d");
          if (offscreenCtx) {
            if (frameData instanceof ImageData) {
              offscreenCtx.putImageData(frameData, 0, 0);
            } else if ((frameData as any).pixels) {
              const rawData = (frameData as any).pixels;
              const uint8Pixels =
                rawData instanceof Uint8ClampedArray ? rawData : new Uint8ClampedArray(rawData);
              const imgData = new ImageData(uint8Pixels, frameData.width, frameData.height);
              offscreenCtx.putImageData(imgData, 0, 0);
            }
          }

          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

          const scale = Math.min(
            targetCanvas.width / offscreen.width,
            targetCanvas.height / offscreen.height
          );
          const drawWidth = offscreen.width * scale;
          const drawHeight = offscreen.height * scale;
          const x = (targetCanvas.width - drawWidth) / 2;
          const y = (targetCanvas.height - drawHeight) / 2;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(offscreen, 0, 0, offscreen.width, offscreen.height, x, y, drawWidth, drawHeight);
        } else {
          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
        }
      } catch (err) {
        console.error("Error updating canvas frame vector", err);
      }

      frame = requestAnimationFrame(renderLoop);
    };

    frame = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(frame);
  }, [deckId, canvasRef]);

  // ResizeObserver
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(canvas);
    handleResize();

    return () => observer.disconnect();
  }, [canvasRef, fullscreen]);

  const formatSeconds = (sec: number) => {
    const s = Math.floor(sec);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`cdg-container ${fullscreen ? "cdg-fullscreen" : ""}`}
      ref={containerRef}
    >
      <canvas ref={canvasRef} className="cdg-canvas" />

      <div className="cdg-controls">
        <span className="cdg-time">{formatSeconds(position)}</span>

        <input
          type="range"
          min={0}
          max={duration || 100}
          value={position}
          onChange={(e) => {
            const newPos = Number(e.target.value);
            audioEngine.setPosition?.(deckId, newPos);
            setPosition(newPos);
          }}
          className="cdg-seek"
        />

        <span className="cdg-time">{formatSeconds(duration)}</span>

        <button
          onClick={() => audioEngine.setPosition?.(deckId, 0)}
          className="cdg-btn cdg-btn-reset"
        >
          Reset
        </button>

        <button
          onClick={() => audioEngine.setPosition?.(deckId, 8)}
          className="cdg-btn cdg-btn-skip"
        >
          Skip Intro
        </button>
      </div>
    </div>
  );
};

export default CDGRenderer;
