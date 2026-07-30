import React from "react";
import { audioEngine } from "../../engine/audioEngine";
import { useDeckCommon } from "./useDeckCommon";
import "../../styles/karaoke_deck.css";

interface KaraokeDeckProps {
  deckId: number;
}

export default function Karaoke_Deck({ deckId }: KaraokeDeckProps) {
  const {
    deck,
    deckLabel,
    metadata,
    nextSinger,
    togglePlayState,
    setMaster,
  } = useDeckCommon(deckId);

  if (!deck) return null;

  const handleSeek = (pos: number) => {
    audioEngine.setPosition(deckId, pos);
    audioEngine.seekCDG(deckId, pos);
    audioEngine.setKaraokePosition(deckId, pos);
  };

  return (
    <div className="karaoke-deck">

      {/* CDG Preview Window */}
      <div className="karaoke-preview">
        <canvas id={`cdg-preview-${deckId}`} width={300} height={216} />
      </div>

      {/* Controls */}
      <div className="karaoke-controls">

        <button
          className="karaoke-btn"
          onClick={() => {
            audioEngine.setKaraoke(deckId, true);
            togglePlayState(deckId);
          }}
        >
          Enable Karaoke
        </button>

        <button
          className="karaoke-btn"
          onClick={() => audioEngine.setKaraoke(deckId, false)}
        >
          Disable Karaoke
        </button>

        <button className="karaoke-btn" onClick={nextSinger}>
          Next Singer
        </button>

        <button
          className="karaoke-btn karaoke-play"
          onClick={() => {
            audioEngine.play(deckId);
            setMaster(deckId);
          }}
        >
          Play
        </button>

        <button
          className="karaoke-btn karaoke-stop"
          onClick={() => audioEngine.stop(deckId)}
        >
          Stop
        </button>

        <input
          className="karaoke-seek"
          type="range"
          min={0}
          max={audioEngine.getDuration(deckId)}
          step={0.01}
          onChange={(e) => handleSeek(Number(e.target.value))}
        />
      </div>

      {/* Metadata */}
      {metadata && (
        <div className="karaoke-meta">
          <div>BPM: {metadata.bpm ?? "Unknown"}</div>
          <div>Key: {metadata.key ?? "Unknown"}</div>
        </div>
      )}
    </div>
  );
}
