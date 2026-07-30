import React, { useEffect, useRef, useState } from "react";
import { useSingerRotation } from "../hooks/useSingerRotation";
import { useShowState } from "../state/showState";
import CDGRenderer from "../components/karaoke/CDGRenderer";
import BackgroundEngine from "../components/karaoke/BackgroundEngine";
import "../styles/karaoke.css";

const KARAOKE_DECK_ID = 1;

const ShowModeScreen: React.FC = () => {
  const { getActiveSinger, getNextSinger } = useSingerRotation();
  const deck = useShowState((s) => s.decks.find((d) => d.id === KARAOKE_DECK_ID));
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const singer = getActiveSinger(KARAOKE_DECK_ID);
  const nextSinger = getNextSinger();

  // CDG fade
  const [fadeIn, setFadeIn] = useState(true);
  useEffect(() => {
    setFadeIn(true);
    const t = setTimeout(() => setFadeIn(false), 500);
    return () => clearTimeout(t);
  }, [deck?.track_path]);

  // Overlay fade
  const [overlayFade, setOverlayFade] = useState(true);
  useEffect(() => {
    setOverlayFade(true);
    const t = setTimeout(() => setOverlayFade(false), 500);
    return () => clearTimeout(t);
  }, [singer?.id]);

  // Title fade + marquee auto-measure
  const [titleFade, setTitleFade] = useState(true);
  const titleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTitleFade(true);
    const t = setTimeout(() => setTitleFade(false), 500);

    const el = titleRef.current;
    if (el) {
      const parentWidth = el.parentElement?.offsetWidth ?? 0;
      const textWidth = el.scrollWidth;

      if (textWidth > parentWidth) {
        el.style.paddingLeft = "100%";
        el.style.animation = "marquee 12s linear infinite";
      } else {
        el.style.paddingLeft = "0";
        el.style.animation = "none";
      }
    }

    return () => clearTimeout(t);
  }, [deck?.track_path]);

  const titleText =
    deck?.track_path?.split("/").pop() ??
    "Karaoke Show";

  return (
    <div
      className="karaoke-show-root"
      style={{
        background: "black",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* BACKGROUND ENGINE */}
      <BackgroundEngine theme="neon" />

      {/* TITLE */}
      {deck?.track_path && (
        <div
          style={{
            position: "absolute",
            top: 20,
            width: "100%",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textAlign: "center",
            zIndex: 3,
            opacity: titleFade ? 0 : 1,
            transition: "opacity 0.5s ease",
          }}
        >
          <div
            ref={titleRef}
            style={{
              display: "inline-block",
              fontSize: 36,
              fontWeight: "bold",
              color: "white",
              WebkitTextStroke: "1px black",
              whiteSpace: "nowrap",
              textShadow: "0 0 12px #00ffff",
            }}
          >
            {titleText}
          </div>

          <style>
            {`
              @keyframes marquee {
                0%   { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
            `}
          </style>
        </div>
      )}

      {/* CDG FULLSCREEN */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
          transition: "opacity 0.5s ease, filter 0.5s ease",
          opacity: fadeIn ? 0 : 1,
          filter: fadeIn ? "blur(6px)" : "blur(0px)",
        }}
      >
        <CDGRenderer deckId={KARAOKE_DECK_ID} canvasRef={canvasRef} fullscreen />
      </div>

      {/* NOW SINGING */}
      {singer && (
        <div
          className="now-singing-banner"
          style={{
            position: "absolute",
            bottom: 40,
            width: "100%",
            textAlign: "center",
            fontSize: 48,
            fontWeight: "bold",
            color: "white",
            WebkitTextStroke: "2px black",
            opacity: overlayFade ? 0 : 1,
            transition: "opacity 0.5s ease",
            zIndex: 2,
            textShadow: "0 0 16px #ff00ff",
          }}
        >
          Now Singing: {singer.name}
        </div>
      )}

      {/* UP NEXT */}
      {nextSinger && (
        <div
          className="up-next-banner"
          style={{
            position: "absolute",
            bottom: 100,
            width: "100%",
            textAlign: "center",
            fontSize: 32,
            fontWeight: "bold",
            color: "white",
            WebkitTextStroke: "1px black",
            opacity: overlayFade ? 0 : 1,
            transition: "opacity 0.5s ease",
            zIndex: 2,
            textShadow: "0 0 12px #00ff99",
          }}
        >
          Up Next: {nextSinger.name}
        </div>
      )}

      {/* HIDDEN CANVAS (if needed by engine) */}
      <canvas id="cdg-output" ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default ShowModeScreen;
