// src/karaoke/karaokeWindowEntry.tsx
import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";

import KaraokeOutputWindow from "./KaraokeOutputWindow";
import SingerOverlay from "./SingerOverlay";
import { useCDGPlayer } from "./useCDGPlayer";
import { listen } from "@tauri-apps/api/event";
import KioskScreen from "./KioskScreen";

type KaraokePlayPayload = {
  cdgPath: string;
  position: number;
};

type KaraokeSeekPayload = {
  position: number;
};

const KaraokeWindowRoot: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef<any>(null);

  const [showKiosk, setShowKiosk] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    playerRef.current = useCDGPlayer(1, canvasRef.current);

    listen<KaraokePlayPayload>("karaoke_play", (event) => {
      const { cdgPath, position } = event.payload;
      playerRef.current.loadCDG(cdgPath).then(() => {
        playerRef.current.start(position);
      });
    });

    listen("karaoke_pause", () => {
      playerRef.current?.pause();
    });

    listen<KaraokeSeekPayload>("karaoke_seek", (event) => {
      const { position } = event.payload;
      playerRef.current?.seek(position);
    });

    listen("karaoke_now_singing", () => setShowKiosk(false));
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {showKiosk ? (
        <KioskScreen />
      ) : (
        <>
          <KaraokeOutputWindow deckId={1} forwardedCanvasRef={canvasRef} />
          <SingerOverlay />
        </>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <KaraokeWindowRoot />
);
