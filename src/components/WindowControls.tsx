import React from "react";
import { invoke } from "@tauri-apps/api/core";
import { useWindowState } from "../state/windowState";

export const WindowControls: React.FC = () => {
  const djOpen = useWindowState((s) => s.djOpen);
  const karaokeOpen = useWindowState((s) => s.karaokeOpen);
  const venueOpen = useWindowState((s) => s.venueOpen);
  const setDjOpen = useWindowState((s) => s.setDjOpen);
  const setKaraokeOpen = useWindowState((s) => s.setKaraokeOpen);
  const setVenueOpen = useWindowState((s) => s.setVenueOpen);

  async function openDj() {
    await invoke("open_dj_screen_cmd");
    setDjOpen(true);
  }

  async function openKaraoke() {
    await invoke("open_karaoke_screen_cmd");
    setKaraokeOpen(true);
  }

  async function openVenue() {
    await invoke("open_venue_screen_cmd");
    setVenueOpen(true);
  }

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={openDj}>
        {djOpen ? "DJ Screen Open" : "Open DJ Screen"}
      </button>
      <button onClick={openKaraoke}>
        {karaokeOpen ? "Karaoke Screen Open" : "Open Karaoke Screen"}
      </button>
      <button onClick={openVenue}>
        {venueOpen ? "Venue Screen Open" : "Open Venue Screen"}
      </button>
    </div>
  );
};
