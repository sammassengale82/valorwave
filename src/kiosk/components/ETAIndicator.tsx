import React from "react";
import { useETAState } from "../../state/etaState";

interface ETAIndicatorProps {
  singerId: string;
}

export const ETAIndicator: React.FC<ETAIndicatorProps> = ({ singerId }) => {
  const getETA = useETAState((s) => s.getETA);
  const etaMs = getETA(singerId);

  const minutes = Math.floor(etaMs / 60000);
  const seconds = Math.floor((etaMs % 60000) / 1000);

  return (
    <div style={{ fontSize: 14, color: "#9ca3af" }}>
      ETA: {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
};
