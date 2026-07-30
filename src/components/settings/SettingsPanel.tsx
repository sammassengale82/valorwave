// src/components/settings/SettingsPanel.tsx
import React, { useEffect, useState } from "react";
import { useSettingsState } from "../../state/settingsState";
import { audioEngine } from "../../engine/audioEngine";

export const SettingsPanel: React.FC = () => {
  const {
    audioOutput,
    audioInput,
    latency,
    theme,
    midiEnabled,
    setAudioOutput,
    setAudioInput,
    setLatency,
    setTheme,
    setMidiEnabled,
  } = useSettingsState();

  // ⭐ FIXED: Changed to generic string array type structures to support native driver tokens (ASIO, CoreAudio)
  const [outputDevices, setOutputDevices] = useState<string[]>([]);
  const [inputDevices, setInputDevices] = useState<string[]>([]);
  const [isUpdatingHardware, setIsUpdatingHardware] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    async function loadHardwareDevices() {
      try {
        // ⭐ FIXED: Fetch hardware driver registries straight from your native Rust core engine layer
        if ((audioEngine as any).getOutputDevices) {
          const outputs = await (audioEngine as any).getOutputDevices();
          if (isMounted) setOutputDevices(outputs || []);
        }
        if ((audioEngine as any).getInputDevices) {
          const inputs = await (audioEngine as any).getInputDevices();
          if (isMounted) setInputDevices(inputs || []);
        }
      } catch (err) {
        console.error("Failed to query native system hardware interfaces", err);
      }
    }

    loadHardwareDevices();
    return () => { isMounted = false; };
  }, []);

  // Safe async wrapper handles restarting hardware sound card streams without locking the main thread
  const handleDeviceChange = async (type: "input" | "output", deviceId: string) => {
    setIsUpdatingHardware(true);
    try {
      if (type === "output") {
        setAudioOutput(deviceId);
        await (audioEngine as any).setAudioOutput?.(deviceId);
      } else {
        setAudioInput(deviceId);
        await (audioEngine as any).setAudioInput?.(deviceId);
      }
    } catch (err) {
      console.error(`Soundcard channel re-routing assignment failure:`, err);
    } finally {
      setIsUpdatingHardware(false);
    }
  };

  const handleLatencyAdjustment = async (samples: number) => {
    setLatency(samples);
    try {
      // Re-clamping native ASIO buffer sizes require non-blocking thread cycles
      await (audioEngine as any).setLatency?.(samples);
    } catch (err) {
      console.error("Failed to re-initialize hardware latency sample buffers:", err);
    }
  };

  return (
    <div 
      className="settings-panel-hud"
      style={{ 
        background: "#121214", 
        padding: "16px", 
        borderRadius: "6px", 
        color: "#e0e0e6", 
        width: "320px",
        fontFamily: "sans-serif",
        border: "1px solid #252528",
        position: "relative"
      }}
    >
      <h3 style={{ margin: "0 0 16px 0", letterSpacing: "0.5px", fontSize: "14px", textTransform: "uppercase", color: "#888" }}>
        ⚙️ System Configurations
      </h3>

      {/* HARDWARE STREAM DISRUPTION OVERLAY */}
      {isUpdatingHardware && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(10,10,12,0.85)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00aaff", zIndex: 10, fontSize: "12px", fontWeight: "bold" }}>
          🔄 RESTARTING AUDIO HARDWARE...
        </div>
      )}

      {/* AUDIO OUTPUT SELECTOR */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
        <label style={{ fontSize: "11px", color: "#666", fontWeight: "bold" }}>AUDIO OUTPUT INTERFACE (ASIO/COREAUDIO)</label>
        <select 
          value={audioOutput ?? ""} 
          onChange={(e) => handleDeviceChange("output", e.target.value)}
          style={{ background: "#1c1c1f", color: "#fff", border: "1px solid #333", padding: "6px", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}
        >
          <option value="">-- Use Default System Driver --</option>
          {outputDevices.map((device, idx) => (
            <option key={`${device}-${idx}`} value={device}>{device}</option>
          ))}
        </select>
      </div>

      {/* AUDIO INPUT SELECTOR */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
        <label style={{ fontSize: "11px", color: "#666", fontWeight: "bold" }}>KARAOKE MICROPHONE CAPTURE INPUT</label>
        <select 
          value={audioInput ?? ""} 
          onChange={(e) => handleDeviceChange("input", e.target.value)}
          style={{ background: "#1c1c1f", color: "#fff", border: "1px solid #333", padding: "6px", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}
        >
          <option value="">-- No Microphone Connected --</option>
          {inputDevices.map((device, idx) => (
            <option key={`${device}-${idx}`} value={device}>{device}</option>
          ))}
        </select>
      </div>

      {/* BUFFER LATENCY SLIDER */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#666", fontWeight: "bold" }}>
          <span>ASIO HARDWARE BUFFER SIZE</span>
          <span style={{ color: "#00ffcc", fontFamily: "monospace" }}>{latency} Samples</span>
        </div>
        <input 
          type="range" 
          min={64} 
          max={1048} 
          step={64} 
          value={latency} 
          onChange={(e) => handleLatencyAdjustment(Number(e.target.value))} 
          style={{ width: "100%", accentColor: "#00aaff", cursor: "pointer" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#444", fontFamily: "monospace" }}>
          <span>64 (Low Latency)</span>
          <span>1028 (Stable Mixing)</span>
        </div>
      </div>

      {/* THEME TYPE SELECTOR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingTop: "8px", borderTop: "1px solid #222" }}>
        <span style={{ fontSize: "12px", color: "#aaa" }}>Interface Theme Profile:</span>
        <select 
          value={theme} 
          onChange={(e) => setTheme(e.target.value as "dark" | "light")}
          style={{ background: "#222", color: "#fff", border: "1px solid #444", padding: "3px 8px", borderRadius: "3px", fontSize: "11px" }}
        >
          <option value="dark">Pro Dark (High Contrast)</option>
          <option value="light">Club Light (Daytime Gig)</option>
        </select>
      </div>

      {/* GLOBAL NATIVE MIDI TOGGLE CHAIN SWITCH */}
      <div style={{ display: "flex", alignItems: "center", padding: "4px 0" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#aaa", cursor: "pointer" }}>
          <input 
            type="checkbox" 
            checked={midiEnabled} 
            onChange={(e) => {
              setMidiEnabled(e.target.checked);
              (audioEngine as any).setMidiEnabled?.(e.target.checked);
            }} 
            style={{ cursor: "pointer", accentColor: "#00aaff" }}
          /> 
          Enable Hardware MIDI Mapping Service
        </label>
      </div>
    </div>
  );
};

export default SettingsPanel;
