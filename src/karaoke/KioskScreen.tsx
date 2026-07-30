import React, { useEffect } from "react";
import QRCode from "react-qr-code";
import { listen } from "@tauri-apps/api/event";
import { useSingerState } from "../state/singerState";

const KioskScreen: React.FC = () => {
  const url = "http://your-ip-address:3030/signup";

  // ⭐ Live queue updates
  useEffect(() => {
    const unlistenPromise = listen("queue_updated", () => {
      // Force Zustand to refresh by cloning state
      useSingerState.setState((s) => ({ ...s }));
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "black",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "40px",
      }}
    >
      <h1 style={{ fontSize: "48px" }}>Scan to Join the Karaoke Queue</h1>
      <QRCode value={url} size={300} />
      <p style={{ fontSize: "24px" }}>{url}</p>
    </div>
  );
};

export default KioskScreen;
