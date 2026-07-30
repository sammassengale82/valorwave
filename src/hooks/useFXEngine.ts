import { useRef } from "react";
import { useFXState } from "../state/fxState";

export function useFXEngine() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const filterRef = useRef<Map<number, BiquadFilterNode>>(new Map());
  const echoDelayRef = useRef<Map<number, DelayNode>>(new Map());
  const echoFeedbackRef = useRef<Map<number, GainNode>>(new Map());
  const echoMixRef = useRef<Map<number, GainNode>>(new Map());
  const reverbRef = useRef<Map<number, ConvolverNode>>(new Map());
  const flangerDelayRef = useRef<Map<number, DelayNode>>(new Map());
  const flangerLFOGainRef = useRef<Map<number, GainNode>>(new Map());
  const flangerLFORef = useRef<Map<number, OscillatorNode>>(new Map());

  function ensureContext(): AudioContext {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }

  /**
   * attachFX(deckId, inputNode, outputNode)
   * Called from audioEngine.play() when creating stems or normal playback.
   */
  function attachFX(deckId: number, inputNode: AudioNode, outputNode: AudioNode) {
    const ctx = ensureContext();

    // -----------------------------
    // FILTER
    // -----------------------------
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 20000;
    filterRef.current.set(deckId, filter);

    // -----------------------------
    // ECHO (delay + feedback + mix)
    // -----------------------------
    const delay = ctx.createDelay(1.0);
    const feedback = ctx.createGain();
    const mix = ctx.createGain();

    delay.delayTime.value = 0.25;
    feedback.gain.value = 0.3;
    mix.gain.value = 0.0; // start dry

    delay.connect(feedback);
    feedback.connect(delay);

    echoDelayRef.current.set(deckId, delay);
    echoFeedbackRef.current.set(deckId, feedback);
    echoMixRef.current.set(deckId, mix);

    // -----------------------------
    // REVERB (simple impulse)
    // -----------------------------
    const convolver = ctx.createConvolver();
    const impulse = ctx.createBuffer(2, 0.5 * ctx.sampleRate, ctx.sampleRate);

    for (let c = 0; c < 2; c++) {
      const channel = impulse.getChannelData(c);
      for (let i = 0; i < channel.length; i++) {
        channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
      }
    }

    convolver.buffer = impulse;
    reverbRef.current.set(deckId, convolver);

    // -----------------------------
    // FLANGER (LFO → delayTime)
    // -----------------------------
    const flangerDelay = ctx.createDelay();
    const lfoGain = ctx.createGain();
    const lfo = ctx.createOscillator();

    lfo.frequency.value = 0.25;
    lfoGain.gain.value = 0.003;

    lfo.connect(lfoGain);
    lfoGain.connect(flangerDelay.delayTime);
    lfo.start();

    flangerDelayRef.current.set(deckId, flangerDelay);
    flangerLFOGainRef.current.set(deckId, lfoGain);
    flangerLFORef.current.set(deckId, lfo);

    // -----------------------------
    // ROUTING CHAIN
    // input → filter → echo → reverb → flanger → output
    // -----------------------------
    inputNode.connect(filter);
    filter.connect(delay);
    delay.connect(mix);
    mix.connect(convolver);
    convolver.connect(flangerDelay);
    flangerDelay.connect(outputNode);
  }

  /**
   * updateFX(deckId)
   * Called from audioEngine.updateDeckFX(deckId)
   * Applies FXState → WebAudio nodes
   */
  function updateFX(deckId: number) {
    const fx = useFXState.getState().fx.find((f) => f.deckId === deckId);
    if (!fx) return;

    const filter = filterRef.current.get(deckId);
    const delay = echoDelayRef.current.get(deckId);
    const feedback = echoFeedbackRef.current.get(deckId);
    const mix = echoMixRef.current.get(deckId);
    const reverb = reverbRef.current.get(deckId);
    const flangerDelay = flangerDelayRef.current.get(deckId);

    if (!filter || !delay || !feedback || !mix || !reverb || !flangerDelay) return;

    if (!fx.enabled) {
      // disable all FX
      filter.frequency.value = 20000;
      delay.delayTime.value = 0;
      feedback.gain.value = 0;
      mix.gain.value = 0;
      flangerDelay.delayTime.value = 0;
      return;
    }

    switch (fx.type) {
      case "filter":
        // fx.param: -1 → LP, +1 → HP
        if (fx.param < 0) {
          filter.type = "lowpass";
          filter.frequency.value = 20000 * (1 + fx.param);
        } else {
          filter.type = "highpass";
          filter.frequency.value = 20 + (20000 - 20) * fx.param;
        }
        break;

      case "echo":
        delay.delayTime.value = fx.param * 0.5;
        feedback.gain.value = fx.wet * 0.6;
        mix.gain.value = fx.wet;
        break;

      case "reverb":
        // simple on/off
        reverb.normalize = fx.wet > 0.1;
        break;

      case "flanger":
        flangerDelay.delayTime.value = fx.param * 0.005;
        break;
    }
  }

  return {
    attachFX,
    updateFX,
  };
}
