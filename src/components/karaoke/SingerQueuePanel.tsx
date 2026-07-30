import React, { useState } from "react";
import { useSingerState } from "../../state/singerState";
import { useUIState } from "../../state/uiState";
import { useSingerAvatarState } from "../../state/singerAvatarState";
import { useETAState } from "../../state/etaState";
import "../../styles/singerQueue.css";

export const SingerQueuePanel: React.FC = () => {
  const singers = useSingerState((s) => s.singers || []);
  const queue = useSingerState((s) => s.queue || []);
  const activeSinger = useSingerState((s) => s.activeSinger);

  const addSinger = useSingerState((s) => s.addSinger);
  const removeSinger = useSingerState((s) => s.removeSinger);
  const bumpSinger = useSingerState((s) => s.bumpSinger);
  const holdSinger = useSingerState((s) => s.holdSinger);
  const nextSinger = useSingerState((s) => s.nextSinger);
  const markSingerDone = useSingerState((s) => s.markSingerDone);

  const setActivePanel = useUIState((s) => s.setActivePanel);
  const getAvatar = useSingerAvatarState((s) => s.getAvatar);
  const getETA = useETAState((s) => s.getETA);

  const [name, setName] = useState("");

  const handleAddSinger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addSinger(name.trim());
    setName("");
  };

  const currentActive = singers.find((s) => String(s.id) === String(activeSinger));

  return (
    <div className="sq-panel">
      <h3 className="sq-title">🎤 Karaoke Rotation Manager</h3>

      {/* Add Singer */}
      <form className="sq-add-form" onSubmit={handleAddSinger}>
        <input
          type="text"
          className="sq-input"
          placeholder="Enter singer name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="sq-add-btn" type="submit">ADD</button>
      </form>

      {/* Active Singer Banner */}
      {currentActive && (
        <div className="sq-active-banner">
          <div className="sq-active-left">
            <span className="sq-active-dot">●</span>
            <span className="sq-active-text">
              NOW SINGING: <span className="sq-active-name">{currentActive.name}</span>
            </span>
          </div>

          <button
            className="sq-profile-btn"
            onClick={() => setActivePanel("SingerProfile")}
          >
            View Profile
          </button>
        </div>
      )}

      {/* Queue List */}
      <div className="sq-list">
        {queue.length === 0 ? (
          <div className="sq-empty">📭 No singers in rotation. Add performers above.</div>
        ) : (
          queue.map((id, index) => {
            const singer = singers.find((x) => String(x.id) === String(id));
            if (!singer) return null;

            const idStr = String(id);
            const avatar = getAvatar(idStr);
            const etaMinutes = Math.floor((getETA(idStr) || 0) / 60000);

            return (
              <div
                key={idStr}
                className={`sq-item ${singer.onHold ? "sq-item-hold" : ""}`}
              >
                {/* Index */}
                <div className="sq-index">#{index + 1}</div>

                {/* Avatar + Name */}
                <div className="sq-meta">
                  <div className="sq-avatar">
                    {avatar ? (
                      <img src={avatar} alt={singer.name} />
                    ) : (
                      singer.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="sq-info">
                    <span className="sq-name">{singer.name}</span>
                    <span className="sq-eta">
                      ETA: {etaMinutes > 0 ? `${etaMinutes}m` : "UP NEXT"}
                    </span>
                  </div>
                </div>

                {/* Controls */}
                <div className="sq-actions">
                  <button className="sq-btn sq-bump" onClick={() => bumpSinger(id)}>
                    BUMP
                  </button>

                  <button
                    className={`sq-btn sq-hold ${singer.onHold ? "sq-hold-active" : ""}`}
                    onClick={() => holdSinger(id)}
                  >
                    {singer.onHold ? "RESUME" : "HOLD"}
                  </button>

                  <button className="sq-remove" onClick={() => removeSinger(id)}>
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Controls */}
      <div className="sq-footer">
        <button className="sq-next-btn" onClick={() => nextSinger()}>
          ⏭️ Next Performer
        </button>

        <button className="sq-complete-btn" onClick={() => markSingerDone()}>
          ✓ Complete Song
        </button>
      </div>
    </div>
  );
};

export default SingerQueuePanel;
