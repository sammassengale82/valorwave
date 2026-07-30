// src/components/PanelDock.tsx
import React from "react";
import { useUIState } from "../state/uiState";
import SystemFeedback from "../components/control-surface/SystemFeedback";
import VenueMode from "./venue-mode/VenueMode";
import MediaSampler from "./media-sampler/MediaSampler";
import ShowSummary from "./show-summary/ShowSummary";
import SingerQueuePanel from "../components/karaoke/SingerQueuePanel";
import PendingRequestsPanel from "../components/karaoke/PendingRequestsPanel";
import SingerProfile from "../components/karaoke/SingerProfile";
import { useSingerState } from "../state/singerState";

export const PanelDock: React.FC = () => {
  const activeSinger = useSingerState((s) => s.activeSinger);

  const activePanel = useUIState((s) => s.activePanel);
  
  if (!activePanel) return null;

  // Helper utility to keep background layers warm in memory without full remount penalties
  const renderPanelWrapper = (panelId: string, children: React.ReactNode) => {
    const isCurrent = activePanel === panelId;
    
    return (
      <div
        style={{
          display: isCurrent ? "block" : "none", // Keeps DOM warm but cleanly hides visual nodes
          width: "100%",
          height: "100%",
          overflowY: "auto", // Restricts long database scrolling strictly inside the docker viewports
          background: "#16161a",
          borderTop: "1px solid #252529"
        }}
      >
        {children}
      </div>
    );
  };

  return (
    <div 
      className="valorwave-panel-dock"
      style={{ 
        flex: 1,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%", 
        minHeight: "260px", // Standard premium bottom layout tier sizing boundaries
        maxHeight: "450px",
        overflow: "hidden", // Prevents the application page view from breaking on long lists
        background: "#111113",
        boxSizing: "border-box"
      }}
    >
      {/* 1. DJ Standard Analytics Views */}
      {renderPanelWrapper("SystemFeedback", <SystemFeedback />)}
      {renderPanelWrapper("VenueMode", <VenueMode />)}
      {renderPanelWrapper("MediaSampler", <MediaSampler />)}
      {renderPanelWrapper("ShowSummary", <ShowSummary />)}

      {/* 2. Karaoke Performance Dashboard Pipeline Layers */}
      {renderPanelWrapper("SingerQueue", <SingerQueuePanel />)}
      {renderPanelWrapper("PendingRequests", <PendingRequestsPanel />)}
      {renderPanelWrapper(
        "SingerProfile",
        activeSinger !== null ? (
          <SingerProfile singerId={Number(activeSinger)} />
        ) : (
          <div style={{ padding: 20, color: "#ccc" }}>
            No singer selected.
          </div>
        )
      )}
    </div>
  );
};

export default PanelDock;
