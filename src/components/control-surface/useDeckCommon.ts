import { useEffect, useRef, useState } from "react";
import { audioEngine } from "../../engine/audioEngine";
import { metadataEngine } from "../../engine/metadataEngine";
import { useShowState } from "../../state/showState";
import { useBeatgridState } from "../../state/beatgridState";
import { useSingerRotation } from "../../hooks/useSingerRotation";
import { registerDeck } from "../../audio/deckRegistry";
import { useMixerStore } from "../../store/mixerStore";
import { DeckId } from "../../types/DeckId";

export function useDeckCommon(deckId: number) {
  const deck = useShowState((s) => s.decks.find((d) => d.id === deckId));
  const togglePlayState = useShowState((s) => s.togglePlay);
  const setMaster = useShowState((s) => s.setMaster);
  const setTempo = useShowState((s) => s.setTempo);
  const setSlip = useShowState((s) => s.setSlip);

  const beatgrid = useBeatgridState((s) => s.grids[deckId] ?? null);
  const { nextSinger } = useSingerRotation();

  const [position, setPositionState] = useState(0);
  const [duration, setDurationState] = useState(0);
  const [metadata, setMetadata] = useState<any>(null);

  const peaksData = audioEngine.getPeaks(deckId) || new Float32Array();
  const peaks =
    peaksData instanceof Float32Array
      ? peaksData
      : new Float32Array(peaksData as any);

  const waveformHotcues = Object.values(deck?.hotcues ?? {}).map((hotcue) => ({
    ...hotcue,
    pos:
      (hotcue as any).pos ??
      (hotcue as any).position_sec ??
      (hotcue as any).time ??
      0,
  }));

  const deckLabel = ["A", "B", "C", "D"][deckId - 1] as "A" | "B" | "C" | "D";

  // POSITION POLLING LOOP
  useEffect(() => {
    let mounted = true;
    let frame = 0;

    const poll = async () => {
      try {
        const p = await audioEngine.getPosition(deckId);
        if (mounted) {
          setPositionState(Number(p));
          setDurationState(audioEngine.getDuration(deckId));
        }
      } catch {
        /* silent */
      }
      frame = requestAnimationFrame(poll);
    };

    frame = requestAnimationFrame(poll);
    return () => {
      mounted = false;
      cancelAnimationFrame(frame);
    };
  }, [deckId]);

  // DECK REGISTRY SYNC
  useEffect(() => {
    const track_path = deck?.track_path || null;
    const timeRemainingMs = Math.max(0, duration - position);

    registerDeck(deckId as DeckId, {
      id: deckId as DeckId,
      track_path,
      is_playing: deck?.is_playing,
      timeRemainingMs,
      play: () => audioEngine.play(deckId as DeckId),
      stop: () => audioEngine.stop(deckId),
      fadeIn: (ms: number) => audioEngine.fadeIn?.(deckId as DeckId, ms),
      fadeOut: (ms: number) => audioEngine.fadeOut?.(deckId as DeckId, ms),
      setTempo: (ratio: number) => audioEngine.setTempo(deckId as DeckId, ratio),
      smartFadeIn: (_a, _b, ms) => audioEngine.fadeIn?.(deckId as DeckId, ms),
      smartFadeOut: (_a, _b, ms) => audioEngine.fadeOut?.(deckId as DeckId, ms),
      echoOut: (ms: number) => audioEngine.fadeOut?.(deckId as DeckId, ms * 0.7),
    });
  }, [deckId, deck?.track_path, deck?.is_playing, position, duration]);

  // TRACK LOADING + METADATA
  async function loadTrack(path: string) {
    await audioEngine.loadTrack(deckId, path);

    try {
      const md = await metadataEngine.analyzeTrack(path);
      setMetadata(md);
    } catch {
      setMetadata(null);
    }
  }

  const mixer = useMixerStore.getState();

  return {
    deck,
    deckLabel,
    peaks,
    waveformHotcues,
    beatgrid,
    metadata,
    position,
    duration,
    nextSinger,
    togglePlayState,
    setMaster,
    setTempo,
    setSlip,
    loadTrack,
    mixer,
  };
}
