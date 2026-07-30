// src/screens/SingerQueue.tsx
import "../styles/singer-queue.css";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSingerState } from "../state/singerState";

export default function SingerQueue() {
  const [requests, setRequests] = useState([]);
  const singers = useSingerState((s) => s.singers);
  const queue = useSingerState((s) => s.queue);
  const bumpSinger = useSingerState((s) => s.bumpSinger);
  const holdSinger = useSingerState((s) => s.holdSinger);

  async function refresh() {
    const list = await invoke<any[]>("request_list");
    setRequests(list);
  }

  async function approve(id: string) {
    await invoke("approve_request", { id });
    refresh();
  }

  async function decline(id: string) {
    await invoke("decline_request", { id });
    refresh();
  }

  useEffect(() => {
    refresh();
  }, []);

 return (
    <div className="sq-root">
      {/* REQUESTS */}
      <h3 className="sq-header">Song Requests</h3>

      {requests.length === 0 && (
        <div className="sq-empty">No requests yet</div>
      )}

      <div className="sq-list">
        {requests.map((req) => (
          <div key={req.id} className="sq-item neon-border">
            <div className="sq-info">
              <div className="sq-avatar">
                {req.name.charAt(0).toUpperCase()}
              </div>
              <div className="sq-text">
                <strong>{req.name}</strong>
                <span>{req.song}</span>
              </div>
            </div>

            <div className="sq-actions">
              <button className="sq-approve" onClick={() => approve(req.id)}>
                Approve
              </button>
              <button className="sq-decline" onClick={() => decline(req.id)}>
                Decline
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ROTATION QUEUE */}
      <h3 className="sq-header">Rotation Queue</h3>

      {queue.length === 0 && (
        <div className="sq-empty">No singers in queue</div>
      )}

      <div className="sq-list">
        {queue.map((id) => {
          const singer = singers.find((s) => s.id === id);
          if (!singer) return null;

          return (
            <div key={id} className={`sq-item neon-border ${singer.onHold ? "sq-hold" : ""}`}>
              <div className="sq-info">
                <div className="sq-avatar">
                  {singer.name.charAt(0).toUpperCase()}
                </div>
                <div className="sq-text">
                  <strong>{singer.name}</strong>
                  <span>{singer.song || "No song selected"}</span>

                  {singer.stats?.lastSungAt && (
                    <span className="sq-last-sung">
                      Last sung: {new Date(singer.stats.lastSungAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="sq-actions">
                <button className="sq-top" onClick={() => bumpSinger(id)}>
                  Move to Top
                </button>

                <button
                  className={singer.onHold ? "sq-unhold" : "sq-hold-btn"}
                  onClick={() => holdSinger(id)}
                >
                  {singer.onHold ? "Unhold" : "Hold"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
