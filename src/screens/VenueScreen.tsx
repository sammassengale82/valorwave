import React, { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

import "../styles/overlay.css";
import "../styles/control-surface.css";

export const VenueScreen: React.FC = () => {
  const [nowSinging, setNowSinging] = useState<string>("Waiting for singer…");
  const [upNext, setUpNext] = useState<string>("Queue is empty.");

  useEffect(() => {
    const unlistenPromise = listen<{
      now: string;
      next: string;
    }>("karaoke_now_singing", (event) => {
      const { now, next } = event.payload;
      setNowSinging(now || "Waiting for singer…");
      setUpNext(next || "Queue is empty.");
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div
      style={{
        background: "#0f172a",
        color: "#e5e7eb",
        width: "100vw",
        height: "100vh",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ marginBottom: 24 }}>ValorWave — Venue Screen</h1>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            border: "1px solid #1f2937",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <h2>Now Singing</h2>
          <p>{nowSinging}</p>
        </div>
        <div
          style={{
            border: "1px solid #1f2937",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <h2>Up Next</h2>
          <p>{upNext}</p>
        </div>
        <div
          style={{
            border: "1px solid #1f2937",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <h2>Requests</h2>
          <p>Scan the QR code to request a song.</p>
          {/* QR component can be added later */}
        </div>
      </div>
    </div>
  );
};
