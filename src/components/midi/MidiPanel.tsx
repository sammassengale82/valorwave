import React, { useState, useEffect } from "react";
import { useMidiMappings } from "../../state/midiMappings";
import { useMidiEngine } from "../../hooks/useMidiEngine";
import "../../styles/midiPanel.css";

export type MidiActionType =
  | "play"
  | "stop"
  | "crossfader"
  | "gain"
  | "eq"
  | "filter"
  | "karaoke"
  | "mic"
  | "stems";

export interface MidiActionPayload {
  type: MidiActionType;
  deck?: 1 | 2 | 3 | 4;
  band?: "low" | "mid" | "high";
  stem?: "vocals" | "drums" | "bass" | "melody" | "other";
}

export const MidiPanel: React.FC = () => {
  const {
    addMapping,
    inputs = [],
    selectedInput,
    setSelectedInput,
    mappings,
    removeMapping
  } = useMidiMappings();

  const { initMidi } = useMidiEngine();

  const [lastMessage, setLastMessage] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [activeMappingTarget, setActiveMappingTarget] =
    useState<MidiActionPayload | null>(null);

  /** Listen for incoming MIDI messages */
  useEffect(() => {
    if (!isListening || !selectedInput) return;

    const handleMidi = (
      e: Event | CustomEvent<{ status: number; data1: number; deviceId: string }>
    ) => {
      const msg = e as CustomEvent<{
        status: number;
        data1: number;
        deviceId: string;
      }>;

      if (msg.detail.deviceId !== selectedInput) return;

      const key = `${msg.detail.status}:${msg.detail.data1}`;
      setLastMessage(key);

      if (activeMappingTarget) {
        addMapping(key, activeMappingTarget);
        setActiveMappingTarget(null);
        setIsListening(false);
      }
    };

    window.addEventListener("midi:message-received", handleMidi);
    return () => window.removeEventListener("midi:message-received", handleMidi);
  }, [isListening, selectedInput, activeMappingTarget, addMapping]);

  /** Toggle capture mode */
  const handleToggleListen = () => {
    if (!selectedInput) {
      alert("Please select a MIDI device first.");
      return;
    }
    setIsListening((prev) => !prev);
  };

  /** Begin mapping a specific action */
  const beginMapping = (action: MidiActionPayload) => {
    setActiveMappingTarget(action);
    setIsListening(true);
    setLastMessage("");
  };

  /** Mapping categories */
  const mappingCategories = [
    {
      title: "Deck Controls",
      items: [
        { label: "Play Deck 1", payload: { type: "play", deck: 1 } },
        { label: "Play Deck 2", payload: { type: "play", deck: 2 } },
        { label: "Stop Deck 1", payload: { type: "stop", deck: 1 } },
        { label: "Stop Deck 2", payload: { type: "stop", deck: 2 } }
      ]
    },
    {
      title: "Mixer Controls",
      items: [
        { label: "Crossfader", payload: { type: "crossfader" } },
        { label: "Gain Deck 1", payload: { type: "gain", deck: 1 } },
        { label: "Gain Deck 2", payload: { type: "gain", deck: 2 } },
        { label: "EQ Low Deck 1", payload: { type: "eq", deck: 1, band: "low" } },
        { label: "EQ Mid Deck 1", payload: { type: "eq", deck: 1, band: "mid" } },
        { label: "EQ High Deck 1", payload: { type: "eq", deck: 1, band: "high" } }
      ]
    },
    {
      title: "Karaoke Controls",
      items: [
        { label: "Toggle Karaoke Mode Deck 1", payload: { type: "karaoke", deck: 1 } },
        { label: "Toggle Karaoke Mode Deck 2", payload: { type: "karaoke", deck: 2 } }
      ]
    },
    {
      title: "Stems Controls",
      items: [
        { label: "Stems: Vocals Deck 1", payload: { type: "stems", deck: 1, stem: "vocals" } },
        { label: "Stems: Drums Deck 1", payload: { type: "stems", deck: 1, stem: "drums" } },
        { label: "Stems: Bass Deck 1", payload: { type: "stems", deck: 1, stem: "bass" } }
      ]
    }
  ];

  return (
    <div className="mp-panel">
      <h3 className="mp-title">🎛️ MIDI Hardware Mapping</h3>

      {/* INIT + DEVICE SELECT */}
      <div className="mp-section">
        <button className="mp-btn-primary" onClick={initMidi}>
          Initialize MIDI Service
        </button>

        <div className="mp-field">
          <label className="mp-label">Active Input Controller</label>
          <select
            className="mp-select"
            value={selectedInput || ""}
            onChange={(e) => setSelectedInput(e.target.value)}
          >
            <option value="">-- Select Hardware Device --</option>
            {inputs.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name || `Device ${device.id}`}
              </option>
            ))}
          </select>
        </div>

        <button
          className={`mp-btn-listen ${isListening ? "mp-listening" : ""}`}
          onClick={handleToggleListen}
        >
          {isListening ? "🛑 Stop Capture" : "🔍 Capture MIDI Signal"}
        </button>
      </div>

      {/* LAST MESSAGE */}
      <div className="mp-lastmsg">
        <div className="mp-lastmsg-row">
          <span className="mp-lastmsg-label">Latest Incoming Key:</span>
          <span className="mp-lastmsg-value">{lastMessage || "WAITING..."}</span>
        </div>

        {activeMappingTarget && (
          <div className="mp-prompt">
            👉 Move a slider or press a button to map:{" "}
            <strong>{activeMappingTarget.type.toUpperCase()}</strong>
          </div>
        )}
      </div>

      {/* MAPPING CATEGORIES */}
      <h4 className="mp-subtitle">Mapping Categories</h4>

      <div className="mp-category-list">
        {mappingCategories.map((cat, idx) => (
          <div key={idx} className="mp-category">
            <h5 className="mp-category-title">{cat.title}</h5>

            <div className="mp-actions">
              {cat.items.map((item, index) => {
                const isTargeted =
                  activeMappingTarget?.type === item.payload.type &&
                  activeMappingTarget?.deck === item.payload.deck &&
                  activeMappingTarget?.band === item.payload.band &&
                  activeMappingTarget?.stem === item.payload.stem;

                return (
                  <button
                    key={index}
                    className={`mp-action-btn ${isTargeted ? "mp-action-active" : ""}`}
                    onClick={() => beginMapping(item.payload)}
                  >
                    <span>{item.label}</span>
                    <span className="mp-action-icon">
                      {lastMessage && !activeMappingTarget ? "⚡" : "🔗"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* EXISTING MAPPINGS */}
      <h4 className="mp-subtitle">Current Mappings</h4>
      <div className="mp-mapping-list">
        {Object.entries(mappings).map(([key, action]) => (
          <div key={key} className="mp-mapping-item">
            <span className="mp-mapping-key">{key}</span>
            <span className="mp-mapping-action">
              {action.type.toUpperCase()} {action.deck ? `D${action.deck}` : ""}
            </span>
            <button className="mp-remove-btn" onClick={() => removeMapping(key)}>
              ✖
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MidiPanel;
