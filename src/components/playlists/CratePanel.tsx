import React, { useState } from "react";
import { useLibraryState } from "../../state/libraryState";
import "../../styles/cratePanel.css";

type DatabaseSource =
  | "local"
  | "karaoke"
  | "streaming"
  | "smart";

const CratePanel: React.FC = () => {
  const { crates, addCrate } = useLibraryState();
  const [name, setName] = useState("");
  const [source, setSource] = useState<DatabaseSource>("local");

  const handleCreate = () => {
    if (!name.trim()) return;
    addCrate(name.trim());
    setName("");
  };

  return (
    <div className="crate-panel">
      <div className="crate-header">
        <h3 className="crate-title">Library Manager</h3>

        {/* Database Selector */}
        <select
          className="crate-db-select"
          value={source}
          onChange={(e) => setSource(e.target.value as DatabaseSource)}
        >
          <option value="local">Local Library</option>
          <option value="karaoke">Karaoke Database</option>
          <option value="streaming">Streaming Services</option>
          <option value="smart">Smart Crates</option>
        </select>
      </div>

      {/* Create Crate */}
      <div className="crate-create">
        <input
          className="crate-input"
          placeholder={`New ${source} crate name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="crate-btn" onClick={handleCreate}>
          Create
        </button>
      </div>

      {/* Crate List */}
      <div className="crate-list">
        {crates.map((c) => (
          <div key={c.id} className="crate-item">
            <div className="crate-item-main">
              <span className="crate-name">{c.name}</span>
              <span className="crate-count">{c.trackIds.length} tracks</span>
            </div>

            <div className="crate-item-actions">
              <button className="crate-action-btn">Rename</button>
              <button className="crate-action-btn">Duplicate</button>
              <button className="crate-action-btn danger">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Smart Crate Button */}
      {source === "smart" && (
        <button className="crate-smart-btn">
          + Create Smart Crate (Rules)
        </button>
      )}
    </div>
  );
};

export default CratePanel;
