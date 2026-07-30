// src/screens/KaraokeScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import { useAudioEngine } from "../hooks/useAudioEngine";
import { useShowState } from "../state/showState";
import { useSingerRotation } from "../hooks/useSingerRotation";
import { useSingerState } from "../state/singerState";

import SingerRotationPanel from "../components/karaoke/SingerRotationPanel";
import CDGRenderer from "../components/karaoke/CDGRenderer";
import SongBrowser from "../components/karaoke/SongBrowser";
import Karaoke_Deck from "../components/control-surface/Karaoke_Deck";

import "../styles/karaoke.css";
import "../styles/singer-queue.css";
import "../styles/singer-profile.css";
import "../styles/singerrotation.css";
import "../styles/decks.css"; // reuse neon theme

const KARAOKE_DECK_ID = 1;

export const KaraokeScreen: React.FC = () => {
  const audio = useAudioEngine();
  const { decks } = useShowState();
  const { nextSinger, addHistoryEntry, incrementSung, getActiveSinger } =
    useSingerRotation();
  const singers = useSingerState((s) => s.singers);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(false);

  // Attach hidden CDG canvas
  useEffect(() => {
    const canvas = document.getElementById("cdg-output") as HTMLCanvasElement;
    canvasRef.current = canvas;
  }, []);

  const deck = useShowState
    .getState()
    .decks.find((d) => d.id === KARAOKE_DECK_ID);

  const isKaraokeTrack =
    !!deck?.cdg_path ||
    (deck?.track_path &&
      (deck.track_path.endsWith(".cdg") ||
       deck.track_path.endsWith(".zip")));

  // AUTO-ADVANCE + HISTORY + SINGER STATS
  useEffect(() => {
    let frame: number;

    const loop = async () => {
      if (isKaraokeTrack) {
        const pos = await audio.getPosition(KARAOKE_DECK_ID);
        const dur = await audio.getDuration(KARAOKE_DECK_ID);

        if (typeof pos === "number" && typeof dur === "number" && dur > 0 && pos >= dur - 0.5) {
          const activeSinger = getActiveSinger(KARAOKE_DECK_ID);

          if (activeSinger && deck?.track_path) {
            const pitch = await audio.getPitch(KARAOKE_DECK_ID);
            const pitchNum = typeof pitch === "number" && !isNaN(pitch) ? pitch : 0;

            addHistoryEntry(activeSinger.name, deck.track_path);
            incrementSung(Number(activeSinger.id));

            activeSinger.avgPitch = (activeSinger.avgPitch + pitchNum) / 2;
          }

          nextSinger();
          setScore(0);

          setOverlayVisible(true);
          setTimeout(() => setOverlayVisible(false), 3000);
        }
      }

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [audio, nextSinger, addHistoryEntry, incrementSung, getActiveSinger]);

  // SCOREBOARD
  useEffect(() => {
    let frame: number;

    const loop = async () => {
      const pitch = await audio.getPitch(KARAOKE_DECK_ID);
      const pitchNum = typeof pitch === "number" && !isNaN(pitch) ? pitch : 0;
      const targetScore = Math.min(100, Math.max(0, pitchNum / 10));
      setScore((prev) => prev + (targetScore - prev) * 0.1);

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [audio]);

  // AUTO-LOAD REQUESTED SONG
  useEffect(() => {
    let frame: number;

    const loop = async () => {
      const deck = useShowState.getState().decks.find((d) => d.id === KARAOKE_DECK_ID);
      const activeSinger = getActiveSinger(KARAOKE_DECK_ID);

      if (deck && activeSinger && activeSinger.requested_song) {
        if (deck.track_path !== activeSinger.requested_song) {
          await audio.loadTrack(KARAOKE_DECK_ID, activeSinger.requested_song);
        }

        if (activeSinger.cdg_path) {
          await audio.loadCDG(KARAOKE_DECK_ID, activeSinger.cdg_path);
        }

        if (isKaraokeTrack) {
          try {
            await invoke("open_karaoke_window");
          } catch (e) {
            console.warn("Failed to open karaoke window:", e);
          }
        }

        setOverlayVisible(true);
        setTimeout(() => setOverlayVisible(false), 3000);
      }

      frame = requestAnimationFrame(loop);
    };

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [audio, getActiveSinger, decks]);

  // UI LAYOUT
  return (
    <div className="karaoke-screen">

      {/* TOP BAR */}
      <div className="dj-topbar">
        <h1>Karaoke Mode</h1>
        <div className="dj-topbar-buttons">
          <button className="dj-btn" onClick={() => invoke("open_dj_screen_cmd")}>DJ</button>
          <button className="dj-btn" onClick={() => invoke("open_karaoke_screen_cmd")}>Karaoke</button>
          <button className="dj-btn" onClick={() => invoke("open_venue_screen_cmd")}>Venue</button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="karaoke-main">
        <div className="karaoke-left">
          <SingerRotationPanel />
        </div>

        <div className="karaoke-right">
          <CDGRenderer deckId={KARAOKE_DECK_ID} canvasRef={canvasRef} />
        </div>
      </div>

      {/* SCOREBOARD */}
      <div className="karaoke-scoreboard">
        <div className="score-title">Scoreboard</div>
        <div className="score-value"
          style={{
            color: score > 70 ? "#00ff00" : score > 40 ? "#ffaa00" : "#ff0000",
          }}
        >
          {Math.round(score)}
        </div>
      </div>

      {/* KARAOKE DECK */}
      <div className="karaoke-deck-row">
        <Karaoke_Deck deckId={1} />
      </div>

      {/* SONG BROWSER */}
      <div className="karaoke-browser">
        <SongBrowser
          onLoadToDeck={(deckId, song) =>
            audio.loadTrack(deckId, song.path, song.cdg_path)
          }
        />
      </div>

      {/* ACTIVE SINGER OVERLAY */}
      {overlayVisible && (
        <div className="karaoke-overlay">
          {getActiveSinger(KARAOKE_DECK_ID)?.name}
        </div>
      )}

      {/* Hidden CDG canvas */}
      <canvas id="cdg-output" style={{ display: "none" }} />
    </div>
  );
};
