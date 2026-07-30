// src/components/control-surface/DJ_Deck.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { audioEngine } from "../../engine/audioEngine";
import WaveformGL from "../waveform/WaveformGL";
import Jogwheel from "./Jogwheel";
import StemsPanel from "../deck/StemsPanel";
import FXPanel from "./FXPanel";
import "../../styles/valorwave.css";

type DJDeckProps = {
  deckId: number;
  vu: number;
};

export default function DJ_Deck({ deckId, vu }: DJDeckProps) {
  // METADATA
  const metadata = audioEngine.getDeckMetadata(deckId);
  const title = metadata?.title ?? "No Track";
  const artist = metadata?.artist ?? "Unknown Artist";
  const bpm = metadata?.bpm ?? "--";
  const key = metadata?.key ?? "--";

  const duration = audioEngine.getDeckDuration(deckId) || 0;
  const rawPeaks = audioEngine.getDeckPeaks(deckId);

  const peaksBuffer = useMemo(() => {
    if (!rawPeaks) return new Float32Array(0);
    return rawPeaks instanceof Float32Array
      ? rawPeaks
      : new Float32Array(rawPeaks);
  }, [rawPeaks]);

  // POSITION POLLING
  const [position, setPosition] = useState(0);

  useEffect(() => {
    let frame = 0;
    let lastUpdate = 0;
    const throttleMs = 33;

    const loop = async (timestamp: number) => {
      if (timestamp - lastUpdate >= throttleMs) {
        const pos = await audioEngine.getDeckPosition(deckId);
        setPosition(pos || 0);
        lastUpdate = timestamp;
      }
      frame = window.requestAnimationFrame(loop);
    };

    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, [deckId]);

  const currentScrollProgress = duration > 0 ? position / duration : 0;

  // VU PEAK HOLD
  const [peak, setPeak] = useState(0);
  useEffect(() => {
    setPeak((prev) => {
      if (vu > prev) return vu;
      return Math.max(0, prev - 0.01);
    });
  }, [vu]);

  // GROUP ASSIGN
  const [group, setGroup] = useState<"A" | "B">("A");

  // MARQUEE
  const [isScrollingText, setIsScrollingText] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const container = el.querySelector<HTMLDivElement>(
      ".marquee-content-container"
    );
    if (!container) return;

    const shouldScroll = container.scrollWidth > el.clientWidth;
    setIsScrollingText(shouldScroll);
  }, [title, artist]);

  const currentTimeStr = formatTime(position);
  const durationStr = formatTime(duration);

  return (
    <div className={`valorwave-deck deck-${deckId}`}>
      {/* JOGWHEEL + TRANSPORT */}
      <div className="deck-jogwheel">
        <Jogwheel
          deckId={deckId}
          isPlaying={position > 0 && position < duration}
        />
        <div className="pitch-bend-controls">
          <button
            onMouseDown={() => audioEngine.pitchBend(deckId, -0.03)}
            onMouseUp={() => audioEngine.pitchBend(deckId, 0)}
          >
            –
          </button>
          <button
            onMouseDown={() => audioEngine.pitchBend(deckId, 0.03)}
            onMouseUp={() => audioEngine.pitchBend(deckId, 0)}
          >
            +
          </button>
        </div>
        <div className="deck-transport">
          <button onClick={() => audioEngine.play(deckId)}>Play</button>
          <button onClick={() => audioEngine.stop(deckId)}>Stop</button>
          <button onClick={() => audioEngine.setPosition(deckId, 0)}>Cue</button>
        </div>
      </div>

      {/* VU METER */}
      <div className="deck-vu">
        <div className="deck-vu-meter">
          <div
            className="deck-vu-bar"
            style={{ height: `${Math.min(1, vu) * 100}%` }}
          />
          <div
            className="deck-vu-peak"
            style={{ top: `${(1 - Math.min(1, peak)) * 100}%` }}
          />
          <div className={`deck-vu-clip ${vu > 0.95 ? "active" : ""}`} />
        </div>
      </div>

      {/* METADATA + MARQUEE */}
      <div className={`deck-trackinfo deck-${deckId}`} ref={scrollRef}>
        <div className="deck-meta-row">
          <div className="meta-pill">
            Time: {currentTimeStr} / {durationStr}
          </div>
          <div className="meta-pill">BPM: {bpm}</div>
          <div className="meta-pill">Key: {key}</div>
        </div>

        <div
          className={`marquee-content-container ${
            isScrollingText ? "scrollable" : ""
          }`}
        >
          <span className="track-title">{title}</span>
          <span className="track-separator"> - </span>
          <span className="track-artist">{artist}</span>

          {isScrollingText && (
            <>
              <span className="track-separator"> • </span>
              <span className="track-title">{title}</span>
              <span className="track-separator"> - </span>
              <span className="track-artist">{artist}</span>
            </>
          )}
        </div>
      </div>

      {/* WAVEFORM */}
      <div className="deck-waveform">
        <WaveformGL
          deckId={deckId}
          zoom={1}
          scroll={currentScrollProgress}
          peaks={peaksBuffer}
          position={position}
          duration={duration}
        />
      </div>

      {/* STEMS */}
      <div className="deck-stems">
        <StemsPanel deckId={deckId} />
      </div>

      {/* FX */}
      <div className="deck-fx">
        <FXPanel deckId={deckId} />
      </div>

      {/* GROUP ASSIGN */}
      <div className="deck-group">
        <button
          className={group === "A" ? "active" : ""}
          onClick={() => setGroup("A")}
        >
          A
        </button>
        <button
          className={group === "B" ? "active" : ""}
          onClick={() => setGroup("B")}
        >
          B
        </button>
      </div>

      {/* BEAT SHIFT */}
      <div className="deck-shift">
        <button onClick={() => audioEngine.shiftBeat(deckId, -1)}>
          Shift Left
        </button>
        <button onClick={() => audioEngine.shiftBeat(deckId, 1)}>
          Shift Right
        </button>
        <button onClick={() => audioEngine.tightenBeat(deckId)}>
          Tighten
        </button>
      </div>
    </div>
  );
}

function formatTime(sec: number): string {
  if (typeof sec !== "number" || isNaN(sec)) return "0:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
