// src/components/control-surface/DeckTransport.tsx
import React from "react";
import { audioEngine } from "../../engine/audioEngine";
import "../../styles/valorwave.css";

interface DeckTransportProps {
  deckId: number;
  deckLabel: string;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export default function DeckTransport({
  deckId,
  deckLabel,
  isPlaying,
  onPlayPause,
}: DeckTransportProps) {
  const handleCue = () => {
    audioEngine.setPosition(deckId, 0);
  };

  const handleSync = () => {
    audioEngine.syncDeck?.(deckId);
  };

  const handleAutoMix = () => {
    audioEngine.triggerAutoMix?.(deckId);
  };

  return (
    <div className="transport-bar">
      {/* CUE */}
      <button
        className="transport-btn cue-btn"
        onClick={handleCue}
        aria-label={`Cue Deck ${deckLabel}`}
      >
        CUE
      </button>

      {/* PLAY / PAUSE */}
      <button
        className={`transport-btn play-btn ${isPlaying ? "active" : ""}`}
        onClick={onPlayPause}
        aria-label={isPlaying ? `Pause Deck ${deckLabel}` : `Play Deck ${deckLabel}`}
      >
        {isPlaying ? "PAUSE" : "PLAY"}
      </button>

      {/* SYNC */}
      <button
        className="transport-btn sync-btn"
        onClick={handleSync}
        aria-label={`Sync Deck ${deckLabel}`}
      >
        SYNC
      </button>

      {/* AUTOMIX */}
      <button
        className="transport-btn automix-btn"
        onClick={handleAutoMix}
        aria-label={`AutoMix Deck ${deckLabel}`}
      >
        AUTOMIX
      </button>
    </div>
  );
}
