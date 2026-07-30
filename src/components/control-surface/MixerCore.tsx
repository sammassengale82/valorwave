// src/components/control-surface/MixerCore.tsx
import React, { useEffect, useState } from "react";
import { audioEngine } from "../../engine/audioEngine";
import Crossfader from "../mixer/Crossfader";
import { Knob } from "react-rotary-knob";
import "../../styles/valorwave.css";

type DeckKey = 1 | 2 | 3 | 4;

interface ChannelEQ {
  low: number;
  mid: number;
  high: number;
  filter: number;
  comp: number;
  limit: number;
}

export default function MixerCore() {
  // VU METERS
  const [vu, setVu] = useState<Record<DeckKey, number>>({
    1: 0, 2: 0, 3: 0, 4: 0,
  });
  const [peak, setPeak] = useState<Record<DeckKey, number>>({
    1: 0, 2: 0, 3: 0, 4: 0,
  });

  // CHANNEL VOLUMES
  const [volume, setVolume] = useState<Record<DeckKey, number>>({
    1: 100, 2: 100, 3: 100, 4: 100,
  });

  // CROSSFADER
  const [cross, setCross] = useState<number>(0);
  const [curveType, setCurveType] = useState<"smooth" | "sharp">("smooth");

  // EQ STATE
  const [eqState, setEqState] = useState<Record<DeckKey, ChannelEQ>>({
    1: { low: 0, mid: 0, high: 0, filter: 0, comp: 0, limit: 0 },
    2: { low: 0, mid: 0, high: 0, filter: 0, comp: 0, limit: 0 },
    3: { low: 0, mid: 0, high: 0, filter: 0, comp: 0, limit: 0 },
    4: { low: 0, mid: 0, high: 0, filter: 0, comp: 0, limit: 0 },
  });

  // ROUTING
  const [crossfadeLeft, setCrossfadeLeft] = useState<number[]>([1, 2]);
  const [crossfadeRight, setCrossfadeRight] = useState<number[]>([3, 4]);

  const toggleLeftRouting = (deck: number) => {
    setCrossfadeLeft((prev) =>
      prev.includes(deck) ? prev.filter((d) => d !== deck) : [...prev, deck]
    );
  };

  const toggleRightRouting = (deck: number) => {
    setCrossfadeRight((prev) =>
      prev.includes(deck) ? prev.filter((d) => d !== deck) : [...prev, deck]
    );
  };

  // MASTER ATTENUATION / CROSSFADER
  useEffect(() => {
    const normalized = (cross + 50) / 100;
    let gainLeft = 1.0;
    let gainRight = 1.0;

    if (curveType === "smooth") {
      gainLeft = Math.cos(normalized * Math.PI * 0.5);
      gainRight = Math.sin(normalized * Math.PI * 0.5);
    } else {
      gainLeft = normalized > 0.95 ? 0 : 1;
      gainRight = normalized < 0.05 ? 0 : 1;
    }

    (audioEngine as any).setCrossfaderPosition?.(normalized);

    ([1, 2, 3, 4] as DeckKey[]).forEach((deck) => {
      let crossfadeModifier = 1.0;
      const isLeft = crossfadeLeft.includes(deck);
      const isRight = crossfadeRight.includes(deck);

      if (isLeft && !isRight) crossfadeModifier = gainLeft;
      else if (isRight && !isLeft) crossfadeModifier = gainRight;
      else if (isLeft && isRight)
        crossfadeModifier =
          curveType === "smooth" ? (gainLeft + gainRight) / 1.414 : 1.0;

      const verticalMasterVol = volume[deck] / 100;
      audioEngine.setChannelGain(deck, verticalMasterVol * crossfadeModifier);
    });
  }, [volume, cross, curveType, crossfadeLeft, crossfadeRight]);

  // EQ HANDLERS
  const handleEqChange = (deck: DeckKey, band: keyof ChannelEQ, val: number) => {
    setEqState((prev) => ({
      ...prev,
      [deck]: { ...prev[deck], [band]: val },
    }));

    if (band === "filter") audioEngine.setFilter?.(deck, val);
    else if (band === "low" || band === "mid" || band === "high")
      audioEngine.setChannelEq?.(deck, band, val);
  };

  // VU POLLING
  useEffect(() => {
    let frame = 0;
    let lastUpdate = 0;
    const throttleMs = 33;

    const loop = (timestamp: number) => {
      if (timestamp - lastUpdate >= throttleMs) {
        const newVu: Record<DeckKey, number> = {
          1: audioEngine.getVU(1) || 0,
          2: audioEngine.getVU(2) || 0,
          3: audioEngine.getVU(3) || 0,
          4: audioEngine.getVU(4) || 0,
        };
        setVu(newVu);

        setPeak((prev) => {
          const next: Record<DeckKey, number> = { ...prev };
          ([1, 2, 3, 4] as DeckKey[]).forEach((d) => {
            next[d] =
              newVu[d] > prev[d] ? newVu[d] : Math.max(0, prev[d] - 0.01);
          });
          return next;
        });

        lastUpdate = timestamp;
      }
      frame = window.requestAnimationFrame(loop);
    };

    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="mixer-grid">

      {/* ROW 1 — EQ */}
      <div className="mixer-eq-row">
        {[1, 2, 3, 4].map((deck) => {
          const channelEq = eqState[deck];
          return (
            <div key={deck} className="mixer-eq-column">

              <div className="knob-group">
                <Knob
                  min={-12}
                  max={12}
                  step={1}
                  value={channelEq.low}
                  onChange={(v) => handleEqChange(deck as DeckKey, "low", v)}
                  className="mixer-knob"
                />
                <span className="knob-label">Low</span>
              </div>

              <div className="knob-group">
                <Knob
                  min={-12}
                  max={12}
                  step={1}
                  value={channelEq.mid}
                  onChange={(v) => handleEqChange(deck as DeckKey, "mid", v)}
                  className="mixer-knob"
                />
                <span className="knob-label">Mid</span>
              </div>

              <div className="knob-group">
                <Knob
                  min={-12}
                  max={12}
                  step={1}
                  value={channelEq.high}
                  onChange={(v) => handleEqChange(deck as DeckKey, "high", v)}
                  className="mixer-knob"
                />
                <span className="knob-label">High</span>
              </div>

              <div className="knob-group">
                <Knob
                  min={-1}
                  max={1}
                  step={0.01}
                  value={channelEq.filter}
                  onChange={(v) => handleEqChange(deck as DeckKey, "filter", v)}
                  className="mixer-knob"
                />
                <span className="knob-label">Filter</span>
              </div>

              <div className="knob-group">
                <Knob
                  min={0}
                  max={1}
                  step={0.01}
                  value={channelEq.comp}
                  onChange={(v) => handleEqChange(deck as DeckKey, "comp", v)}
                  className="mixer-knob"
                />
                <span className="knob-label">Comp</span>
              </div>

              <div className="knob-group">
                <Knob
                  min={0}
                  max={1}
                  step={0.01}
                  value={channelEq.limit}
                  onChange={(v) => handleEqChange(deck as DeckKey, "limit", v)}
                  className="mixer-knob"
                />
                <span className="knob-label">Limit</span>
              </div>

            </div>
          );
        })}
      </div>

      {/* ROW 2 — CHANNEL FADERS + VU */}
      <div className="mixer-volume-row">
        {[1, 2, 3, 4].map((deck) => (
          <div key={deck} className="mixer-volume-column">

            <div className="volume-slider-container">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={volume[deck]}
                onChange={(e) =>
                  setVolume((prev) => ({ ...prev, [deck]: Number(e.target.value) }))
                }
                className="volume-slider-vertical"
              />
              <div className="volume-slider-ticks">
                {Array.from({ length: 11 }).map((_, tick) => (
                  <span key={tick} className="v-tick" />
                ))}
              </div>
            </div>

            <div className="mixer-vu-percent-group">
              <div className="mixer-vu-meter">
                <div
                  className="mixer-vu-bar"
                  style={{ height: `${vu[deck] * 100}%` }}
                />
                <div
                  className="mixer-vu-peak"
                  style={{ top: `${(1 - peak[deck]) * 100}%` }}
                />
                <div
                  className={`mixer-vu-clip ${vu[deck] > 0.95 ? "active" : ""}`}
                />
              </div>
              <span className="volume-percent">{volume[deck]}%</span>
            </div>

          </div>
        ))}
      </div>

      {/* ROW 3 — CROSSFADER */}
      <div className="mixer-crossfader-row">

        <div className="crossfade-routing">
          {[1, 2, 3, 4].map((d) => (
            <div
              key={d}
              className={`crossfade-box ${
                crossfadeLeft.includes(d) ? "selected" : ""
              }`}
              onClick={() => toggleLeftRouting(d)}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="crossfade-center">
          <div className="curve-selector-wrap">
            <label htmlFor="curve-select" className="curve-label">
              FADE CURVE:
            </label>
            <select
              id="curve-select"
              value={curveType}
              onChange={(e) =>
                setCurveType(e.target.value as "smooth" | "sharp")
              }
              className="curve-dropdown"
            >
              <option value="smooth">SMOOTH (MIX)</option>
              <option value="sharp">SHARP (SCRATCH)</option>
            </select>
          </div>

          <Crossfader value={cross} onChange={(v) => setCross(v)} />
        </div>

        <div className="crossfade-routing">
          {[1, 2, 3, 4].map((d) => (
            <div
              key={d}
              className={`crossfade-box ${
                crossfadeRight.includes(d) ? "selected" : ""
              }`}
              onClick={() => toggleRightRouting(d)}
            >
              {d}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
