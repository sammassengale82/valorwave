// KaraokeOutputWindow.tsx
import React, { useEffect } from "react";

interface Props {
  deckId: number;
  forwardedCanvasRef: React.RefObject<HTMLCanvasElement>;
}

const KaraokeOutputWindow: React.FC<Props> = ({ forwardedCanvasRef }) => {
  useEffect(() => {
    const canvas = forwardedCanvasRef.current;
    if (!canvas) return;

    // Dynamic resolution
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [forwardedCanvasRef]);

  return (
    <div className="karaoke-output" style={{ width: "100%", height: "100%" }}>
      <canvas ref={forwardedCanvasRef} />
    </div>
  );
};

export default KaraokeOutputWindow;
