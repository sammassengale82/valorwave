import React, { useEffect, useState } from "react";
import { useKaraokeRequests } from "../../hooks/useKaraokeRequests";
import { useSingerRotation } from "../../hooks/useSingerRotation";
import { useSingerState } from "../../state/singerState";
import "../../styles/pendingRequests.css";

export const PendingRequestsPanel: React.FC = () => {
  const { listRequests, approveRequest, declineRequest } = useKaraokeRequests();
  const { addSinger, setSingerSong } = useSingerRotation();

  const globalSingers = useSingerState((s) => s.singers || []);
  const [requests, setRequests] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll incoming kiosk requests
  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const updated = await listRequests();
        if (active) setRequests(updated || []);
      } catch (err) {
        console.error("Failed to sync kiosk requests:", err);
      }
    }

    poll();
    const interval = setInterval(poll, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [listRequests]);

  async function refresh() {
    setIsRefreshing(true);
    try {
      const updated = await listRequests();
      setRequests(updated || []);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleApprove(id: number) {
    const targetReq = requests.find((r) => r.id === id);
    if (!targetReq) return;

    const req = await approveRequest(id);
    if (!req) return;

    try {
      const existingSinger = globalSingers.find(
        (s) => s.name.trim().toLowerCase() === req.name.trim().toLowerCase()
      );

      let singerId: number;

      if (existingSinger) {
        singerId = Number(existingSinger.id);
      } else {
        const newIdRaw = await addSinger(req.name);
        singerId = Number(newIdRaw);
      }

      await setSingerSong(singerId, req.song);
      await refresh();
    } catch (err) {
      console.error("Failed to process request:", err);
    }
  }

  async function handleDecline(id: number) {
    if (window.confirm("Decline this performance request?")) {
      await declineRequest(id);
      await refresh();
    }
  }

  return (
    <div className="pr-dashboard">
      {/* Header */}
      <div className="pr-header">
        <h4 className="pr-title">Pending Requests ({requests.length})</h4>

        <button
          className={`pr-refresh-btn ${isRefreshing ? "pr-refreshing" : ""}`}
          onClick={refresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Syncing..." : "🔄 Refresh"}
        </button>
      </div>

      {/* List */}
      <div className="pr-list">
        {requests.length === 0 ? (
          <div className="pr-empty">📭 No pending kiosk submissions.</div>
        ) : (
          requests.map((req) => {
            const isReturnSinger = globalSingers.some(
              (s) => s.name.trim().toLowerCase() === req.name.trim().toLowerCase()
            );

            return (
              <div key={req.id} className="pr-item">
                <div className="pr-meta">
                  <div className="pr-name">
                    {req.name}
                    {isReturnSinger && (
                      <span className="pr-returning">RETURNING</span>
                    )}
                  </div>
                  <div className="pr-song">🎵 {req.song}</div>
                </div>

                <div className="pr-actions">
                  <button
                    className="pr-accept"
                    onClick={() => handleApprove(req.id)}
                  >
                    ACCEPT
                  </button>
                  <button
                    className="pr-reject"
                    onClick={() => handleDecline(req.id)}
                  >
                    REJECT
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PendingRequestsPanel;
