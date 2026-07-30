import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "../../styles/karaoke.css";

interface FavoriteSongsManagerProps {
  singerId: number;
  favoriteSongs: string[];
  onUpdated: () => void;
}

export default function FavoriteSongsManager({
  singerId,
  favoriteSongs,
  onUpdated,
}: FavoriteSongsManagerProps) {
  const [newSong, setNewSong] = useState("");

  async function addSong() {
    if (!newSong.trim()) return;
    await invoke("add_favorite_song", { id: singerId, song: newSong });
    setNewSong("");
    onUpdated();
  }

  async function removeSong(song: string) {
    await invoke("remove_favorite_song", { id: singerId, song });
    onUpdated();
  }

  return (
    <div className="fav-manager">
      <h3 className="fav-title">Favorite Songs</h3>

      <ul className="fav-list">
        {favoriteSongs.map((song, i) => (
          <li key={i} className="fav-item">
            <span className="fav-song">{song}</span>
            <button
              className="fav-remove-btn"
              onClick={() => removeSong(song)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="fav-add">
        <input
          type="text"
          className="fav-input"
          value={newSong}
          onChange={(e) => setNewSong(e.target.value)}
          placeholder="Add a favorite song..."
        />
        <button className="fav-add-btn" onClick={addSong}>
          Add
        </button>
      </div>
    </div>
  );
}
