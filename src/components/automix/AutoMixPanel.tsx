// src/components/automix/AutomixPanel.tsx
import React, { useEffect, useState } from "react";
import { useAutoMixState } from "../../state/autoMixState";
import { metadataEngine } from "../../engine/metadataEngine";
import { audioEngine } from "../../engine/audioEngine";
import TransitionPreview from "./TransitionPreview";
import QueueEditor from "./QueueEditor";
import "../../styles/automixpanel.css";

interface AutomixTrack {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key?: string | null;
  duration_sec?: number;
  intro_sec?: number;
  outro_sec?: number;
  energy: number;
  path: string;
}

type AutomixMode = "dj" | "karaoke";
type TransitionStyle = "smart" | "fade" | "cut" | "echo";

function scoreTransition(from: AutomixTrack, to: AutomixTrack): number {
  const bpmDiff = Math.abs(from.bpm - to.bpm);
  const bpmScore = Math.max(0, 1 - bpmDiff / 10);

  const energyDiff = Math.abs(from.energy - to.energy);
  const energyScore = Math.max(0, 1 - energyDiff / 5);

  const keyScore = from.key === to.key ? 1 : 0.5;

  return bpmScore * 0.5 + energyScore * 0.3 + keyScore * 0.2;
}

export const AutomixPanel: React.FC = () => {
  const {
    enabled,
    mode,
    transitionStyle,
    fade_duration_sec,
    syncBPM,
    autoGain,
    autoEQ,
    setEnabled,
    setMode,
    setTransitionStyle,
    setfade_duration_sec,
    setSyncBPM,
    setAutoGain,
    setAutoEQ,
    target_bpm,
    queue,
    setTargetBpm,
    setQueue,
  } = useAutoMixState();

  const [showSettings, setShowSettings] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const [transitionProgress, setTransitionProgress] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const [currentPeaks, setCurrentPeaks] = useState<number[]>([]);
  const [nextPeaks, setNextPeaks] = useState<number[]>([]);

  const currentTrack = queue[0] as AutomixTrack | undefined;
  const nextTrack = queue[1] as AutomixTrack | undefined;

  // Waveform peak generation for current/next tracks
  useEffect(() => {
    let isMounted = true;

    async function fetchPeaks() {
      if (currentTrack?.path) {
        try {
          const peaks = await metadataEngine.generatePeaks(currentTrack.path);
          if (isMounted) setCurrentPeaks(peaks);
        } catch (err) {
          console.error("Failed to generate outgoing peaks", err);
          if (isMounted) setCurrentPeaks([]);
        }
      } else {
        setCurrentPeaks([]);
      }

      if (nextTrack?.path) {
        try {
          const peaks = await metadataEngine.generatePeaks(nextTrack.path);
          if (isMounted) setNextPeaks(peaks);
        } catch (err) {
          console.error("Failed to generate incoming peaks", err);
          if (isMounted) setNextPeaks([]);
        }
      } else {
        setNextPeaks([]);
      }
    }

    fetchPeaks();
    return () => {
      isMounted = false;
    };
  }, [currentTrack?.path, nextTrack?.path]);

  // Global hotkey: Shift+Space toggles Automix engine
  useEffect(() => {
    const handleGlobalHotkeys = (e: KeyboardEvent) => {
      if (e.shiftKey && e.code === "Space") {
        e.preventDefault();
        setEnabled(!enabled);
      }
    };

    window.addEventListener("keydown", handleGlobalHotkeys);
    return () => window.removeEventListener("keydown", handleGlobalHotkeys);
  }, [enabled, setEnabled]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    try {
      const rawData = e.dataTransfer.getData("application/valorwave-track");
      if (!rawData) return;

      const track = JSON.parse(rawData);
      const newAutomixTrack: AutomixTrack = {
        id: track.id || crypto.randomUUID(),
        title: track.title,
        artist: track.artist || "Unknown Artist",
        bpm: track.bpm || 120.0,
        key: track.key || null,
        duration_sec: track.duration || 0,
        energy: track.energy || 0.5,
        path: track.path,
      };

      if (setQueue) {
        setQueue([...queue, newAutomixTrack]);
      }
    } catch (err) {
      console.error("Failed to drop track into Automix queue", err);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    if (setQueue) {
      setQueue(queue.filter((t) => t.id !== trackId));
    }
  };

  const handleTriggerManualMix = async () => {
    if (queue.length < 2) return;

    setIsTransitioning(true);
    setTransitionProgress(1);

    const intervalTime = 100;
    const totalSteps = fade_duration_sec / intervalTime;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      const progress = Math.min((currentStep / totalSteps) * 100, 100);
      setTransitionProgress(progress);

      if (currentStep >= totalSteps) {
        clearInterval(fadeInterval);
        setIsTransitioning(false);
        setTransitionProgress(0);

        if (setQueue) {
          const [, ...remaining] = queue;
          setQueue(remaining);
        }
      }
    }, intervalTime);
  };

  const handleDoubleLoadOverride = async (track: AutomixTrack) => {
    try {
      await audioEngine.loadTrack(1, track.path, (track as any).cdgPath);
    } catch (err) {
      console.error("Manual loading interrupt failure override", err);
    }
  };

  return (
    <div
      className={`automix-panel ${isDraggingOver ? "automix-panel--dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* HEADER ENGINE STATUS CONTROLS */}
      <div className="automix-header">
        <div className="automix-header-left">
          <input
            type="checkbox"
            id="automix-toggle"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <label
            htmlFor="automix-toggle"
            className={`automix-toggle-label ${enabled ? "automix-toggle-label--active" : ""}`}
          >
            AUTOMIX ENGINE
          </label>
        </div>

        <div className="automix-header-right">
          <span className="automix-header-bpm-label">BPM:</span>
          <input
            type="number"
            value={target_bpm ?? ""}
            onChange={(e) => setTargetBpm(Number(e.target.value))}
            className="automix-header-bpm-input"
          />
          <button
            className={`automix-settings-btn ${showSettings ? "automix-settings-btn--active" : ""}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Mix Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* ADVANCED LIVE CROSSFADER PREFERENCE CONTROLS */}
      {showSettings && (
        <div className="automix-settings">
          <div className="automix-settings-row">
            <span>Mixing Mode:</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as AutomixMode)}
              className="automix-select"
            >
              <option value="dj">DJ Performance</option>
              <option value="karaoke">Karaoke Rotation</option>
            </select>
          </div>

          <div className="automix-settings-row">
            <span>Fader Profile:</span>
            <select
              value={transitionStyle}
              onChange={(e) => setTransitionStyle(e.target.value as TransitionStyle)}
              className="automix-select"
            >
              <option value="smart">Smart EQ Blending</option>
              <option value="fade">Linear Crossfade</option>
              <option value="cut">Instant Hard Cut</option>
              <option value="echo">Echo Out Delay</option>
            </select>
          </div>

          <div className="automix-settings-duration">
            <div className="automix-settings-duration-header">
              <span>Blend Duration:</span>
              <span className="automix-settings-duration-value">
                {(fade_duration_sec / 1000).toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={15000}
              step={500}
              value={fade_duration_sec}
              onChange={(e) => setfade_duration_sec(Number(e.target.value))}
              className="automix-duration-slider"
            />
          </div>

          <div className="automix-settings-flags">
            <label className="automix-flag">
              <input
                type="checkbox"
                checked={syncBPM}
                onChange={(e) => setSyncBPM(e.target.checked)}
              />
              Auto-Sync
            </label>
            <label className="automix-flag">
              <input
                type="checkbox"
                checked={autoGain}
                onChange={(e) => setAutoGain(e.target.checked)}
              />
              AGC Gain
            </label>
            <label className="automix-flag">
              <input
                type="checkbox"
                checked={autoEQ}
                onChange={(e) => setAutoEQ(e.target.checked)}
              />
              Smart EQ
            </label>
          </div>
        </div>
      )}

      {/* TRANSITION PROGRESS HUD */}
      {isTransitioning && (
        <div className="automix-transition-hud">
          <div className="automix-transition-header">
            <span>⚠️ CROSSFADE TRANSITION ACTIVE...</span>
            <span>{transitionProgress.toFixed(0)}%</span>
          </div>
          <div className="automix-transition-bar">
            <div
              className="automix-transition-bar-fill"
              style={{ width: `${transitionProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* QUEUE LIST */}
      <div className="automix-queue">
        {queue.length === 0 ? (
          <div className="automix-empty">
            📥 Drag & Drop audio records here from your library grid to initialize automixing loops.
          </div>
        ) : (
          queue.map((t, index) => {
            const score = scoreTransition(
              {
                id: "current",
                title: "Active Monitor",
                artist: "",
                bpm: target_bpm ?? 0,
                key: null,
                energy: 0.5,
                path: "",
              },
              t as AutomixTrack
            );
            const isHovered = hoveredRowId === t.id;

            return (
              <div
                key={t.id}
                className={`automix-row ${
                  index === 0 ? "automix-row--active" : ""
                }`}
                onMouseEnter={() => setHoveredRowId(t.id)}
                onMouseLeave={() => setHoveredRowId(null)}
                onDoubleClick={() => handleDoubleLoadOverride(t as AutomixTrack)}
              >
                <div className={`automix-row-index ${index === 0 ? "automix-row-index--active" : ""}`}>
                  {index === 0 ? "▶" : index}
                </div>

                <div className="automix-row-main">
                  <div
                    className={`automix-row-title ${
                      index === 0 ? "automix-row-title--active" : ""
                    }`}
                  >
                    {t.title}
                  </div>
                  <div className="automix-row-artist">
                    {t.artist || "Unknown Artist"}
                  </div>
                </div>

                {isHovered ? (
                  <div
                    className={`automix-row-actions ${
                      index === 0 ? "automix-row-actions--active" : ""
                    }`}
                  >
                    {index === 0 && (
                      <button
                        className="automix-row-btn automix-row-btn--mix"
                        onClick={handleTriggerManualMix}
                        disabled={queue.length < 2 || isTransitioning}
                        title="Force Immediate Crossfade Blend Out"
                      >
                        MIX NEXT
                      </button>
                    )}
                    <button
                      className="automix-row-btn automix-row-btn--remove"
                      onClick={() => handleRemoveTrack(t.id)}
                      title="Eject Record from Pipeline"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="automix-row-meta">
                      <span className="automix-row-bpm">
                        {t.bpm ? t.bpm.toFixed(1) : "--"}
                      </span>
                      {t.key && (
                        <span className="automix-row-key">
                          {t.key}
                        </span>
                      )}
                    </div>

                    {index > 0 && (
                      <div
                        className="automix-row-score"
                        title={`Harmonic & Tempo Match Compatibility Score: ${(score * 100).toFixed(0)}%`}
                        style={{
                          background:
                            score > 0.7
                              ? "#00ff00"
                              : score > 0.4
                              ? "#ffff00"
                              : "#ff0000",
                        }}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER VISUALIZER */}
      <div className="automix-footer">
        <TransitionPreview
          currentPeaks={currentPeaks}
          nextPeaks={nextPeaks}
          fadeDuration={fade_duration_sec}
        />
        <QueueEditor />
      </div>
    </div>
  );
};

export default AutomixPanel;
