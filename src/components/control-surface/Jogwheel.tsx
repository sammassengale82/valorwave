import React, { useRef, useState, useEffect } from "react";
import { audioEngine } from "../../engine/audioEngine";
import "../../styles/jogwheel.css";

interface JogwheelProps {
  deckId: number;
  isPlaying: boolean;
}

export default function Jogwheel({ deckId, isPlaying }: JogwheelProps) {
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const lastAngle = useRef(0);

  const [rotation, setRotation] = useState(0);

  // Auto‑spin when playing
  useEffect(() => {
    if (!isPlaying || isDragging.current) return;

    let frame: number;
    let lastTime = performance.now();

    const spin = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      const degPerMs = 0.2; // 33⅓ RPM visual spin
      setRotation((r) => (r + delta * degPerMs) % 360);

      frame = requestAnimationFrame(spin);
    };

    frame = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying]);

  const getMouseAngle = (clientX: number, clientY: number): number => {
    if (!wheelRef.current) return 0;
    const rect = wheelRef.current.getBoundingClientRect();

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const radians = Math.atan2(clientY - cy, clientX - cx);
    let deg = radians * (180 / Math.PI);
    if (deg < 0) deg += 360;
    return deg;
  };

  const handleDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    lastAngle.current = getMouseAngle(e.clientX, e.clientY);

    audioEngine.stop(deckId);
    if ((audioEngine as any).toggleVinylMode) {
      (audioEngine as any).toggleVinylMode(deckId, true);
    }
  };

  const handleUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if ((audioEngine as any).toggleVinylMode) {
      (audioEngine as any).toggleVinylMode(deckId, false);
    }

    if (isPlaying) {
      audioEngine.play(deckId);
    }
  };

  const handleMove = async (e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const currentAngle = getMouseAngle(e.clientX, e.clientY);
    let delta = currentAngle - lastAngle.current;

    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    lastAngle.current = currentAngle;

    setRotation((r) => (r + delta) % 360);

    const ratio = 1.8 / 360;
    const timeDelta = delta * ratio;

    try {
      const pos = Number(await audioEngine.getPosition(deckId)) || 0;
      const newPos = Math.max(0, pos + timeDelta);
      await audioEngine.setPosition(deckId, newPos);
    } catch (err) {
      console.error("Jogwheel scratch error:", err);
    }
  };

  return (
    <div
      ref={wheelRef}
      className={`jogwheel ${isPlaying ? "jw-playing" : ""} ${
        isDragging.current ? "jw-scratching" : ""
      }`}
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      style={{
        transform: `rotate(${rotation}deg)`,
      }}
    >
      <div
        className="jog-center"
        style={{ transform: `rotate(${-rotation}deg)` }}
      >
        {deckId}
      </div>

      <div className="jogwheel-led" />
    </div>
  );
}
