import React, { useEffect, useState } from "react";

import DJScreen from "./screens/DJ_Screen";

import { useAudioEvents } from "./hooks/useAudioEvents";
import { useSystemMetrics } from "./hooks/useSystemMetrics";

import "./styles/global.css";

const App: React.FC = () => {
  useAudioEvents();
  useSystemMetrics();

  const [karaokeState, setKaraokeState] = useState({
    now: "",
    next: "",
    song: "",
  });
  const [beat, setBeat] = useState(0);
  const [pitchAcc, setPitchAcc] = useState(0);
  const [timingAcc, setTimingAcc] = useState(0);
  const [crowd, setCrowd] = useState(0);

  useEffect(() => {
    const handleKaraoke = (e: CustomEvent) => setKaraokeState(e.detail);
    const handleBeat = (e: CustomEvent) => setBeat(e.detail.beat);
    const handleScore = (e: CustomEvent) => {
      setPitchAcc(e.detail.accuracy);
      setTimingAcc(e.detail.timing);
    };
    const handleCrowd = (e: CustomEvent) => setCrowd(e.detail.energy);

    window.addEventListener("karaoke_now_singing", handleKaraoke as EventListener);
    window.addEventListener("karaoke_beat", handleBeat as EventListener);
    window.addEventListener("karaoke_score", handleScore as EventListener);
    window.addEventListener("karaoke_crowd", handleCrowd);

    return () => {
      window.removeEventListener("karaoke_now_singing", handleKaraoke as EventListener);
      window.removeEventListener("karaoke_beat", handleBeat as EventListener);
      window.removeEventListener("karaoke_score", handleScore as EventListener);
      window.removeEventListener("karaoke_crowd", handleCrowd);
    };
  }, []);

  // Main Tauri window = DJ / primary layout
  return <DJScreen />;
};

export default App;
