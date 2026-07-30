import React, { useState } from "react";
import { useLibraryState } from "../../state/libraryState";
import "../../styles/playlistPanel.css";

interface PlaylistPanelProps {
  playlists: any[];
}

export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({ playlists }) => {
  const {
    currentPlaylistId,
    setCurrentPlaylist,
    addPlaylist,
    playNextQueue,
    tracks,
  } = useLibraryState();

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    playlistId: string | null;
  } | null>(null);

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    addPlaylist(newPlaylistName.trim());
    setNewPlaylistName("");
    setIsCreating(false);
  };

  const handleRightClick = (
    e: React.MouseEvent,
    playlistId: string
  ) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      playlistId,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handlePlaylistSelect = (id: string) => {
    setCurrentPlaylist(id);
    closeContextMenu();
  };

  return (
    <div className="pl-panel">
      {/* HEADER */}
      <div className="pl-header">
        <h4 className="pl-title">Playlists</h4>
        <button
          className="pl-add-btn"
          onClick={() => setIsCreating(!isCreating)}
          title="Create New Playlist"
        >
          ➕
        </button>
      </div>

      {/* CREATE PLAYLIST INPUT */}
      {isCreating && (
        <form className="pl-create-form" onSubmit={handleCreatePlaylist}>
          <input
            autoFocus
            placeholder="Playlist name..."
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="pl-create-input"
          />
          <button type="submit" className="pl-create-submit">
            Add
          </button>
        </form>
      )}

      {/* PLAYLIST LIST */}
      <div className="pl-list">
        {playlists.map((p) => {
          const isActive = p.id === currentPlaylistId;

          return (
            <div
              key={p.id}
              className={`pl-item ${isActive ? "pl-item--active" : ""}`}
              onClick={() => handlePlaylistSelect(p.id)}
              onContextMenu={(e) => handleRightClick(e, p.id)}
              draggable
              title="Right-click for options"
            >
              <span className="pl-item-name">🎶 {p.name}</span>
              <span className="pl-item-count">{p.trackIds.length}</span>
            </div>
          );
        })}
      </div>

      {/* PLAY NEXT QUEUE */}
      {playNextQueue.length > 0 && (
        <div className="pl-next-section">
          <h4 className="pl-next-title">
            Play Next ({playNextQueue.length})
          </h4>

          <div className="pl-next-list">
            {playNextQueue.map((id, index) => {
              const t = tracks[id];
              if (!t) return null;

              return (
                <div key={`${id}-${index}`} className="pl-next-item">
                  <span className="pl-next-index">{index + 1}</span>
                  <span className="pl-next-title-text">{t.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTEXT MENU */}
      {contextMenu && (
        <div
          className="pl-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={closeContextMenu}
        >
          <div className="pl-context-item">Rename Playlist</div>
          <div className="pl-context-item">Delete Playlist</div>
          <div className="pl-context-item">Export Playlist</div>
          <div className="pl-context-item">Duplicate Playlist</div>
          <div className="pl-context-item">Convert to Smart Playlist</div>
        </div>
      )}
    </div>
  );
};

export default PlaylistPanel;
