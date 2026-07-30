import React, { useEffect, useRef, useState } from "react";
import "../../styles/karaoke.css";

interface BackgroundEngineProps {
  theme?: "neon" | "classic" | "dark";
}

const BackgroundEngine: React.FC<BackgroundEngineProps> = ({ theme = "neon" }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fadeIn, setFadeIn] = useState(true);

  // Fade-in animation
  useEffect(() => {
    setFadeIn(true);
    const t = setTimeout(() => setFadeIn(false), 500);
    return () => clearTimeout(t);
  }, [theme]);

  // Canvas gradient animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame: number;
    let t = 0;

    const render = () => {
      const { width, height } = canvas;
      t += 0.01;

      const grad = ctx.createLinearGradient(
        0,
        0,
        width * Math.sin(t * 0.3),
        height * Math.cos(t * 0.2)
      );

      if (theme === "neon") {
        grad.addColorStop(0, "#0f0c29");
        grad.addColorStop(0.5, "#302b63");
        grad.addColorStop(1, "#24243e");
      } else if (theme === "classic") {
        grad.addColorStop(0, "#1a1a1a");
        grad.addColorStop(1, "#444444");
      } else {
        grad.addColorStop(0, "#000000");
        grad.addColorStop(1, "#222222");
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) / 1.2
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      className={`vw-bg-canvas ${fadeIn ? "vw-bg-fade-in" : "vw-bg-ready"}`}
    />
  );
};

export default BackgroundEngine;
