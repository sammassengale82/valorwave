import React, { useMemo } from "react";
import WaveformGL from "../waveform/WaveformGL";
import "../../styles/transitionpreview.css";

interface TransitionPreviewProps {
  currentPeaks: number[];
  nextPeaks: number[];
  fadeDuration: number;
}

export const TransitionPreview: React.FC<TransitionPreviewProps> = ({
  currentPeaks,
  nextPeaks,
  fadeDuration,
}) => {
  const fadeSeconds = fadeDuration / 1000;

  const currentPeaksTyped = useMemo(
    () => new Float32Array(currentPeaks),
    [currentPeaks]
  );

  const nextPeaksTyped = useMemo(
    () => new Float32Array(nextPeaks),
    [nextPeaks]
  );

  return (
    <div className="tp-root">
      <h4 className="tp-title">Transition Preview</h4>

      <div className="tp-waveform-container">
        {/* Outgoing Track */}
        <div className="tp-wave tp-wave--current">
          <WaveformGL
            deckId={1}
            peaks={currentPeaksTyped}
            duration={0}
            position={0}
            zoom={1}
            scroll={0}
          />
        </div>

        {/* Incoming Track */}
        <div className="tp-wave tp-wave--next">
          <WaveformGL
            deckId={2}
            peaks={nextPeaksTyped}
            duration={0}
            position={0}
            zoom={1}
            scroll={0}
          />
        </div>

        {/* Crossfade Anchor */}
        <div className="tp-anchor" />
      </div>

      <div className="tp-footer">
        <span>Crossfade Mix Window:</span>
        <span className="tp-duration">{fadeSeconds.toFixed(1)}s</span>
      </div>
    </div>
  );
};

export default TransitionPreview;
