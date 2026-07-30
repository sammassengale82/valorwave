import React, { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import "../styles/overlay.css";

type KaraokeNowSingingPayload = {
  now: string;
  next: string;
};

const SingerOverlay: React.FC = () => {
  const [now, setNow] = useState("");
  const [next, setNext] = useState("");

  useEffect(() => {
    listen<KaraokeNowSingingPayload>(
      "karaoke_now_singing",
      (e) => {
        setNow(e.payload.now);
        setNext(e.payload.next);
      }
    );
  }, []);

  return (
    <div className="overlay">
      <div className="now">{now}</div>
      <div className="next">Up Next: {next}</div>
    </div>
  );
};

export default SingerOverlay;
