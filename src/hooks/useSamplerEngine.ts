import { useRef } from "react";
import { useSamplerState } from "../state/samplerState";

export function useSamplerEngine() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const buffersRef = useRef<Map<number, AudioBuffer>>(new Map());

  function ensureContext(): AudioContext {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }

  async function loadPad(id: number, file: File) {
    const ctx = ensureContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    buffersRef.current.set(id, audioBuffer);
  }

  function triggerPad(id: number) {
    const ctx = ensureContext();
    const buffer = buffersRef.current.get(id);
    if (!buffer) return;

    const pad = useSamplerState.getState().pads.find((p) => p.id === id);
    if (!pad) return;

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();

    source.buffer = buffer;
    source.playbackRate.value = pad.pitch;
    gain.gain.value = pad.volume;

    source.connect(gain);
    gain.connect(ctx.destination);

    if (pad.loop) {
      source.loop = true;
    }

    source.start(0);
  }

  return {
    loadPad,
    triggerPad,
  };
}
