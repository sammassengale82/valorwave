// src/screens/DJ_Screen.tsx
import React from "react";
import MixerCore from "../components/control-surface/MixerCore";
import DJ_Deck from "../components/control-surface/DJ_Deck";
import BrowserPanel from "../components/browser/BrowserPanel";
import { audioEngine } from "../engine/audioEngine";
import "../styles/valorwave.css";

export default function DJ_Screen() {
  return (
    <div className="valorwave-screen">
      <header className="vw-topbar">
        <h1>ValorWave</h1>
        <div className="vw-topbar-buttons">
          <button>REC</button>
          <button>Settings</button>
          <button>Help</button>
        </div>
      </header>

      {/* TOP 60% — decks + mixer */}
      <div className="vw-main">
        {/* LEFT COLUMN: Decks 1 & 2 */}
        <div className="vw-left-column">
          <div className="vw-deck-row">
            <DJ_Deck deckId={1} vu={0.3} />
            <DJ_Deck deckId={2} vu={0.3} />
          </div>
        </div>

        {/* CENTER MIXER */}
        <div className="vw-mixer-center">
          <MixerCore />
        </div>

        {/* RIGHT COLUMN: Decks 3 & 4 */}
        <div className="vw-right-column">
          <div className="vw-deck-row">
            <DJ_Deck deckId={3} vu={0.3} />
            <DJ_Deck deckId={4} vu={0.3} />
          </div>
        </div>
      </div>

      {/* BOTTOM 40% — browser */}
      <BrowserPanel 
        onLoadToDeck={(deckId, path, cdgPath) => {
          console.log(`Loading track into Deck ${deckId}: ${path}`);
          
          // Call your audio engine loader routine
          audioEngine.loadTrack(deckId, path);
          
          // If a karaoke graphic layer file track exists, trigger the CDG video processor
          if (cdgPath) {
            console.log(`Loading Karaoke CDG file layer: ${cdgPath}`);
            // audioEngine.loadCDG(deckId, cdgPath); // Uncomment when your karaoke display is ready
          }
        }} 
      />

    </div>
  );
}
