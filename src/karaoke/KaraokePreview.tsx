// KaraokePreview.tsx
import React, { useEffect, useRef } from "react";
import { useCDGPlayer } from "./useCDGPlayer";

interface Props {
  deckId: number;
  cdgPath?: string;
  positionSeconds: number;
}

const KaraokePreview: React.FC<Props> = ({ deckId, cdgPath, positionSeconds }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    playerRef.current = useCDGPlayer(deckId, canvasRef.current);

    if (cdgPath) {
      playerRef.current.loadCDG(cdgPath).then(() => {
        playerRef.current.start(positionSeconds);
      });
    }
  }, [cdgPath]);

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.seek(positionSeconds);
    }
  }, [positionSeconds]);

  return (
    <div className="karaoke-preview">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default KaraokePreview;
