import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "../../styles/singerNotes.css";

interface Props {
  singerId: number;
}

export default function SingerNotesEditor({ singerId }: Props) {
  const [notes, setNotes] = useState("");

  async function loadNotes() {
    const profile = await invoke<any>("get_singer_profile", { id: singerId });
    setNotes(profile?.notes || "");
  }

  async function saveNotes() {
    await invoke("update_singer_notes", { id: singerId, notes });
  }

  useEffect(() => {
    if (singerId) loadNotes();
  }, [singerId]);

  if (!singerId) {
    return <div className="sne-panel sne-empty">No singer selected</div>;
  }

  return (
    <div className="sne-panel">
      <h3 className="sne-title">Singer Notes</h3>

      <textarea
        className="sne-textarea"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes about this singer..."
      />

      <button className="sne-save-btn" onClick={saveNotes}>
        Save Notes
      </button>
    </div>
  );
}
