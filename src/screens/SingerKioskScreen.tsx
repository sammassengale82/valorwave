import React from "react";
import { useSingerState } from "../state/singerState";
import SongBrowser from "../components/karaoke/SongBrowser";

export default function SingerKioskScreen() {
  const singers = useSingerState((s) => s.singers);
  const addSinger = useSingerState((s) => s.addSinger);

  return (
    <div style={{ background: "#111", color: "white", padding: 20 }}>
      <h1>Singer Check‑In</h1>

      <input
        type="text"
        placeholder="Your name"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            addSinger(e.currentTarget.value);
            e.currentTarget.value = "";
          }
        }}
      />

      <h2>Search Songs</h2>
      <SongBrowser kioskMode />
    </div>
  );
}
