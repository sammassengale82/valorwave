import React from "react";
import { useShowState } from "../../state/showState";
import { audioEngine } from "../../engine/audioEngine";
import "../../styles/hotcues.css";

interface HotCuesProps {
  deckId: number;
}

export default function HotCues({ deckId }: HotCuesProps) {
  const setHotcueState = useShowState((s) => s.setHotcue);
  const deck = useShowState((s) => s.decks?.find((d) => d.id === deckId));
  const activeHotcues = deck?.hotcues || {};

  const handlePadInteraction = async (num: number) => {
    const existingCue = activeHotcues[num];

    try {
      if (existingCue) {
        // TRIGGER HOTCUE
        if ((audioEngine as any).triggerHotcue) {
          await (audioEngine as any).triggerHotcue(deckId, num);
        } else if ((audioEngine as any).setPosition) {
          await audioEngine.setPosition(deckId, existingCue.position_sec);
        }
      } else {
        // SET HOTCUE
        const currentPos = await audioEngine.getPosition(deckId);
        setHotcueState(deckId, num);

        if ((audioEngine as any).setHotcue) {
          await (audioEngine as any).setHotcue(deckId, num, currentPos || 0);
        }
      }
    } catch (err) {
      console.error(`Hotcue ${num} failed on Deck ${deckId}:`, err);
    }
  };

  const handleRightClickClear = (e: React.MouseEvent, num: number) => {
    e.preventDefault();
    if (!activeHotcues[num]) return;

    setHotcueState(deckId, num);

    if ((audioEngine as any).deleteHotcue) {
      (audioEngine as any).deleteHotcue(deckId, num);
    }
  };

  const getPadColor = (num: number) => {
    const colors = ["#ff0055", "#00ffcc", "#ffcc00", "#a855f7"];
    return colors[(num - 1) % colors.length];
  };

  return (
    <div className="hotcues-root">
      {[1, 2, 3, 4].map((num) => {
        const hasCue = !!activeHotcues[num];
        const color = getPadColor(num);

        return (
          <button
            key={num}
            className={`hotcue-pad ${hasCue ? "hotcue-active" : ""}`}
            style={
              hasCue
                ? { "--pad-color": color } as React.CSSProperties
                : undefined
            }
            onClick={() => handlePadInteraction(num)}
            onContextMenu={(e) => handleRightClickClear(e, num)}
            title={
              hasCue
                ? "Click to Jump • Right‑Click to Delete"
                : "Click to Set Hotcue"
            }
          >
            <span className="hotcue-pad-index">PAD {num}</span>
            <span className="hotcue-pad-label">
              {hasCue ? "CUE" : "EMPTY"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
