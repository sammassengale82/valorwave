// src/components/control-surface/SystemFeedback.tsx
import React from "react";
import { useSystemState } from "../../state/systemState";
import "../../styles/systemfeedback.css";

export const SystemFeedback: React.FC = () => {
  const cpu = useSystemState((s) => s.cpu ?? 0);
  const gpu = useSystemState((s) => s.gpu ?? 0);
  const latency = useSystemState((s) => s.latency ?? 0);
  const uptime = useSystemState((s) => s.uptime ?? 0);
  const dropouts = (useSystemState as any)((s: any) => s.dropouts ?? 0);

  const formatUptime = (seconds: number) => {
    if (typeof seconds !== "number" || isNaN(seconds)) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getStatusColorClass = (loadValue: number) => {
    if (loadValue > 85) return "sf-status-critical";
    if (loadValue > 60) return "sf-status-warning";
    return "sf-status-ok";
  };

  const cpuStatusClass = getStatusColorClass(cpu);
  const gpuStatusClass = getStatusColorClass(gpu);

  return (
    <div className="system-telemetry-hud">
      <div className="sf-header">
        <span className="sf-title">💻 Engine Diagnostics</span>
        <span className={`sf-status ${cpuStatusClass}`}>
          {cpu > 85 ? "⚠️ OVERLOAD" : cpu > 60 ? "⚠️ STRAIN" : "● ONLINE"}
        </span>
      </div>

      <div className="sf-body">
        <div className="sf-row">
          <span className="sf-label">HOST CPU LOAD:</span>
          <div className="sf-bar-wrap">
            <div className="sf-bar">
              <div
                className={`sf-bar-fill ${cpuStatusClass}`}
                style={{ width: `${Math.min(cpu, 100)}%` }}
              />
            </div>
            <span className={`sf-value ${cpuStatusClass}`}>
              {cpu.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="sf-row">
          <span className="sf-label">GPU PROCESSING:</span>
          <div className="sf-bar-wrap">
            <div className="sf-bar">
              <div
                className={`sf-bar-fill ${gpuStatusClass}`}
                style={{ width: `${Math.min(gpu, 100)}%` }}
              />
            </div>
            <span className={`sf-value ${gpuStatusClass}`}>
              {gpu.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="sf-row">
          <span className="sf-label">AUDIO BUFFER LATENCY:</span>
          <span className={`sf-latency ${latency > 15 ? "sf-status-warning" : "sf-status-ok"}`}>
            {latency} ms
          </span>
        </div>

        <div className="sf-row">
          <span className="sf-label">BUFFER DROPOUTS:</span>
          <span className={`sf-dropouts ${dropouts > 0 ? "sf-status-critical" : "sf-status-muted"}`}>
            {dropouts}
          </span>
        </div>

        <div className="sf-row sf-runtime">
          <span className="sf-label">SESSION RUNTIME:</span>
          <span className="sf-runtime-value">{formatUptime(uptime)}</span>
        </div>
      </div>
    </div>
  );
};

export default SystemFeedback;
