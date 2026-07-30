// src/engine/audioEngine.ts
import { invoke } from "@tauri-apps/api/core";
import { metadataEngine } from "./metadataEngine";

export class AudioEngine {
  private audioCtx: AudioContext | null = null;

  private buffers = new Map<number, AudioBuffer>();
  private sources = new Map<number, AudioBufferSourceNode[]>();
  private peaks = new Map<number, number[]>();
  private beatgrids = new Map<number, any>();
  private startTime = new Map<number, number>();
  private startOffset = new Map<number, number>();
  private playbackRate = new Map<number, number>();
  private trackMetadata = new Map<number, any>();

  private stemBuffers = new Map<
    number,
    {
      vocal?: AudioBuffer;
      drums?: AudioBuffer;
      bass?: AudioBuffer;
      other?: AudioBuffer;
    }
  >();

  private stemSources = new Map<
    number,
    {
      vocal?: AudioBufferSourceNode;
      drums?: AudioBufferSourceNode;
      bass?: AudioBufferSourceNode;
      other?: AudioBufferSourceNode;
    }
  >();

  private stemGains = new Map<
    number,
    {
      vocal: GainNode;
      drums: GainNode;
      bass: GainNode;
      other: GainNode;
    }
  >();

  private cdgPlayers = new Map<number, any>();
  private vuMeters = new Map<number, AnalyserNode>();
  private masterAnalyser: AnalyserNode | null = null;
  private currentMasterDeckId: number = 0;

  private mixerChannels = new Map<
    number,
    {
      gain: GainNode;
      low: BiquadFilterNode;
      mid: BiquadFilterNode;
      high: BiquadFilterNode;
      analyser: AnalyserNode;
    }
  >();

  private crossfaderLeft: GainNode | null = null;
  private crossfaderRight: GainNode | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    const ctx = this.ensureContext();

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 1;

    this.crossfaderLeft = ctx.createGain();
    this.crossfaderRight = ctx.createGain();

    this.crossfaderLeft.connect(this.masterGain);
    this.crossfaderRight.connect(this.masterGain);

    this.masterAnalyser = ctx.createAnalyser();
    this.masterAnalyser.fftSize = 2048;

    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(ctx.destination);
  }

  private ensureContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }
    return this.audioCtx;
  }

  // -----------------------------
  // High-level helpers
  // -----------------------------
  async analyzeTrack(fullPath: string) {
    return metadataEngine.analyzeTrack(fullPath);
  }

  async extractCDGFromZip(fullPath: string): Promise<string | null> {
    return null;
  }

  // -----------------------------
  // Track loading
  // -----------------------------
  async loadTrack(deckId: number, track_path: string, cdgPath?: string) {
    const ctx = this.ensureContext();

    const fileData = await (window as any).__TAURI__.fs.readBinaryFile(
      track_path
    );
    const audioBuffer = await ctx.decodeAudioData(fileData.buffer);

    this.buffers.set(deckId, audioBuffer);
    this.startOffset.set(deckId, 0);
    this.playbackRate.set(deckId, 1);

    await invoke("load_track_cmd", { deckId, track_path, cdg_path: cdgPath });

    const low = ctx.createBiquadFilter();
    low.type = "lowshelf";
    low.frequency.value = 200;

    const mid = ctx.createBiquadFilter();
    mid.type = "peaking";
    mid.frequency.value = 1000;
    mid.Q.value = 1;

    const high = ctx.createBiquadFilter();
    high.type = "highshelf";
    high.frequency.value = 6000;

    const gain = ctx.createGain();
    gain.gain.value = 1;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;

    low.connect(mid);
    mid.connect(high);
    high.connect(gain);
    gain.connect(analyser);

    if (deckId % 2 !== 0) {
      analyser.connect(this.crossfaderLeft!);
    } else {
      analyser.connect(this.crossfaderRight!);
    }

    this.mixerChannels.set(deckId, { gain, low, mid, high, analyser });
    this.vuMeters.set(deckId, analyser);

    if (this.currentMasterDeckId === 0 || this.currentMasterDeckId === deckId) {
      this.currentMasterDeckId = deckId;
      this.masterAnalyser = analyser;
    }

    const metadata = await metadataEngine.analyzeTrack(track_path);
    this.trackMetadata.set(deckId, metadata);

    if (metadata.peaks) {
      this.setPeaks(deckId, metadata.peaks);
    }

    if (!this.getBeatgrid(deckId) && metadata.bpm) {
      this.setBeatgrid(deckId, {
        bpm: metadata.bpm,
        first_beat_sec: 0,
        beats: [],
      });
    }
  }

  getDeckMetadata(deckId: number) {
    const buffer = this.buffers.get(deckId);
    const grid = this.beatgrids.get(deckId);
    return this.trackMetadata.get(deckId) ?? null;
  }

  // -----------------------------
  // Playback
  // -----------------------------
  getDuration(deckId: number): number {
    return this.buffers.get(deckId)?.duration ?? 0;
  }

  async getPosition(deckId: number): Promise<number> {
    const pos = await invoke("get_position_cmd", { deckId });
    return Number(pos) || 0;
  }

  async getPitch(deckId: number): Promise<number | null> {
    const val = await invoke("detect_pitch_cmd", { deckId });
    return val as number;
  }

  async getDeckPosition(deckId: number): Promise<number> {
    const pos = await invoke("get_position_cmd", { deckId });
    return this.getPosition(deckId);
  }

  getDeckDuration(deckId: number): number {
    return this.getDuration(deckId);
  }

  // -----------------------------
  // Waveform / beatgrid access
  // -----------------------------
  setPeaks(deckId: number, peaks: number[]) {
    this.peaks.set(deckId, peaks);
  }

  getPeaks(deckId: number): Float32Array | null {
    const p = this.peaks.get(deckId);
    if (!p) return null;
    return new Float32Array(p);
  }

  getDeckPeaks(deckId: number): Float32Array {
    return this.getPeaks(deckId) ?? new Float32Array();
  }

  setBeatgrid(deckId: number, grid: any) {
    this.beatgrids.set(deckId, grid);
  }

  getBeatgrid(deckId: number): any {
    return this.beatgrids.get(deckId) ?? null;
  }

  shiftBeat(deckId: number, direction: number) {
    const grid = this.beatgrids.get(deckId);
    if (!grid) return;

    // Move first beat by ± one beat length
    const bpm = grid.bpm ?? 120;
    const beatLength = 60 / bpm;
    grid.first_beat_sec += direction * beatLength;

    this.beatgrids.set(deckId, grid);
    invoke("shift_beat_cmd", { deckId, direction });
  }

  tightenBeat(deckId: number) {
    const grid = this.beatgrids.get(deckId);
    if (!grid) return;

    // Re‑align beats to nearest integer seconds
    const bpm = grid.bpm ?? 120;
    const beatLength = 60 / bpm;
    const totalBeats = Math.floor(this.getDuration(deckId) / beatLength);
    grid.beats = Array.from({ length: totalBeats }, (_, i) => i * beatLength);


    this.beatgrids.set(deckId, grid);
    invoke("tighten_beat_cmd", { deckId });
  }

  // -----------------------------
  // STEMS ENGINE
  // -----------------------------
  async loadStems(
    deckId: number,
    stems: {
      vocal?: string;
      drums?: string;
      bass?: string;
      other?: string;
    }
  ) {
    const ctx = this.ensureContext();

    const buffers: {
      vocal?: AudioBuffer;
      drums?: AudioBuffer;
      bass?: AudioBuffer;
      other?: AudioBuffer;
    } = {};

    const gains = {
      vocal: ctx.createGain(),
      drums: ctx.createGain(),
      bass: ctx.createGain(),
      other: ctx.createGain(),
    };

    gains.vocal.gain.value = 1;
    gains.drums.gain.value = 1;
    gains.bass.gain.value = 1;
    gains.other.gain.value = 1;

    const loadStem = async (key: keyof typeof stems) => {
      const path = stems[key];
      if (!path) return;

      const fileData = await (window as any).__TAURI__.fs.readBinaryFile(path);
      const buf = await ctx.decodeAudioData(fileData.buffer);
      buffers[key] = buf;
    };

    await loadStem("vocal");
    await loadStem("drums");
    await loadStem("bass");
    await loadStem("other");

    this.stemBuffers.set(deckId, buffers);
    this.stemGains.set(deckId, gains);
  }

  private createStemSources(deckId: number, startPos: number) {
    const ctx = this.ensureContext();
    const buffers = this.stemBuffers.get(deckId);
    const gains = this.stemGains.get(deckId);
    const ch = this.mixerChannels.get(deckId);

    if (!buffers || !gains || !ch) return;

    const sources: {
      vocal?: AudioBufferSourceNode;
      drums?: AudioBufferSourceNode;
      bass?: AudioBufferSourceNode;
      other?: AudioBufferSourceNode;
    } = {};

    const make = (key: keyof typeof buffers) => {
      const buf = buffers[key];
      if (!buf) return;

      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = this.playbackRate.get(deckId) ?? 1;

      src.connect(gains[key]);
      gains[key].connect(ch.low);

      src.start(0, startPos);
      sources[key] = src;
    };

    make("vocal");
    make("drums");
    make("bass");
    make("other");

    this.stemSources.set(deckId, sources);
  }

  private stopStemSources(deckId: number) {
    const sources = this.stemSources.get(deckId);
    if (!sources) return;

    Object.values(sources).forEach((src) => {
      try {
        src?.stop();
      } catch {
        // ignore
      }
    });

    this.stemSources.set(deckId, {});
  }

  // Called from useAudioEngine.updateStems
  async updateStems(
    deckId: number,
    enabled: boolean,
    gains: {
      vocal: number;
      drums: number;
      bass: number;
      other: number;
    }
  ) {
    await invoke("set_stems_enabled", { deck_id: deckId, enabled });
    await invoke("set_stem_gains", { deck_id: deckId, gains });

    const stemGainNodes = this.stemGains.get(deckId);
    if (stemGainNodes) {
      stemGainNodes.vocal.gain.value = gains.vocal;
      stemGainNodes.drums.gain.value = gains.drums;
      stemGainNodes.bass.gain.value = gains.bass;
      stemGainNodes.other.gain.value = gains.other;
    }
  }

    play(deckId: number) {
    const ctx = this.ensureContext();
    
    // Resume context if browser suspended it due to lack of initial interaction
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const pos = this.startOffset.get(deckId) ?? 0;
    const buffer = this.buffers.get(deckId);
    const ch = this.mixerChannels.get(deckId);

    // 1. Clean up any existing active master track sources to prevent overlaps
    const existingTrackSources = this.sources.get(deckId) ?? [];
    existingTrackSources.forEach((src) => {
      try { src.stop(); } catch { /* Already stopped */ }
    });

    // 2. If a normal audio buffer exists, create and track its node source
    if (buffer && ch) {
      const trackSrc = ctx.createBufferSource();
      trackSrc.buffer = buffer;
      
      // Inherit the active deck playback rate/tempo modifications
      const activeRate = this.playbackRate.get(deckId) ?? 1.0;
      trackSrc.playbackRate.value = activeRate;

      // Connect to the low EQ filter bands on the mixer deck channel
      trackSrc.connect(ch.low);
      trackSrc.start(0, pos);

      // Save the active master source node inside the mapping tracker array
      this.sources.set(deckId, [trackSrc]);
    } else {
      this.sources.set(deckId, []);
    }

    // 3. Keep stem sources playing perfectly alongside the master track
    this.stopStemSources(deckId);
    this.createStemSources(deckId, pos);

    return invoke("play_cmd", { deckId });
  }

    stop(deckId: number) {
    this.stopStemSources(deckId);

    // Stop and clear the main master track source arrays
    const trackSources = this.sources.get(deckId);
    if (trackSources) {
      trackSources.forEach((src) => {
        try { src.stop(); } catch { /* Already stopped */ }
      });
      this.sources.set(deckId, []);
    }

    return invoke("stop_cmd", { deckId });
  }

  setTempo(deckId: number, ratio: number) {
    this.playbackRate.set(deckId, ratio);

    const sources = this.stemSources.get(deckId);
    if (sources) {
      Object.values(sources).forEach((src) => {
        if (src) src.playbackRate.value = ratio;
      });
    }

    return invoke("set_tempo_cmd", { deckId, ratio });
  }

  setPosition(deckId: number, pos: number) {
    this.startOffset.set(deckId, pos);

    this.stopStemSources(deckId);
    this.createStemSources(deckId, pos);

    return invoke("set_position_cmd", { deckId, pos });
  }

  // Used by Jogwheel.tsx
  setPlaybackRate(deckId: number, rate: number) {
    this.playbackRate.set(deckId, rate);

    const stemSources = this.stemSources.get(deckId);
    if (stemSources) {
      Object.values(stemSources).forEach((src) => {
        if (src) src.playbackRate.value = rate;
      });
    }

    const trackSources = this.sources.get(deckId);
    if (trackSources) {
      trackSources.forEach((src) => {
        src.playbackRate.value = rate;
      });
    }
  }

  setStemGain(
    deckId: number,
    stem: "vocal" | "drums" | "bass" | "other",
    value: number
  ) {
    const gains = this.stemGains.get(deckId);
    if (!gains) return;

    gains[stem].gain.value = value;
  }

  // -----------------------------
  // FX
  // -----------------------------
  setEcho(deckId: number, amount: number) {
    return invoke("set_echo", { deckId, amount });
  }

  setBrake(deckId: number, amount: number) {
    return invoke("set_brake", { deckId, amount });
  }

  setFilter(deckId: number, value: number) {
    return invoke("set_filter", { deckId, value });
  }

  setSlip(deckId: number, enabled: boolean) {
    return invoke("set_slip", { deck_id: deckId, enabled });
  }

  setGain(deckId: number, gain: number) {
    return invoke("set_gain", { deck_id: deckId, gain });
  }

  getChannelGain(deckId: number): number {
    const ch = this.mixerChannels.get(deckId);
    if (!ch) return 0;
    return ch.gain.gain.value;
  }

  setFX(deckId: number, type: string, amount: number) {
    switch (type) {
      case "echo":
        return this.setEcho(deckId, amount);
      case "brake":
        return this.setBrake(deckId, amount);
      case "filter":
        return this.setFilter(deckId, amount);
      case "roll":
        return invoke("trigger_roll_cmd", { deckId, amount });
      default:
        console.warn("Unknown FX type:", type);
    }
  }

  // -----------------------------
  // Karaoke
  // -----------------------------
  setKaraoke(deckId: number, enabled: boolean) {
    return invoke("set_karaoke", { deckId, enabled });
  }

  setKaraokePosition(deckId: number, pos: number) {
    return invoke("set_karaoke_position", { deckId, pos });
  }

  setCurrentSinger(deckId: number, singerId: string | null) {
    return invoke("set_current_singer", { deckId, singerId });
  }

  // -----------------------------
  // CDG
  // -----------------------------
  async loadCDG(deckId: number, cdgPath: string) {
    const data = await (window as any).__TAURI__.fs.readBinaryFile(cdgPath);
    await invoke("cdg_load", { deckId, data: Array.from(data) });
  }

  startCDG(deckId: number, pos: number) {
    return invoke("cdg_start", { deckId, position: pos });
  }

  seekCDG(deckId: number, pos: number) {
    return invoke("cdg_seek", { deckId, position: pos });
  }

  async getCDGFrame(
    deckId: number
  ): Promise<
    | null
    | {
        pixels: ArrayBuffer | ArrayBufferView | number[];
        width: number;
        height: number;
      }
  > {
    const frame = await invoke("get_cdg_frame", { deckId });
    return frame as any;
  }

  async getCDGFrameAt(
    deckId: number,
    positionSec: number
  ): Promise<
    | null
    | {
        pixels: ArrayBuffer | ArrayBufferView | number[];
        width: number;
        height: number;
      }
  > {
    const frame = await this.getCDGFrame(deckId);
    return frame;
  }

  // -----------------------------
  // VU METERS
  // -----------------------------
  getVU(deckId: number): number {
    const analyser = this.vuMeters.get(deckId);
    if (!analyser) return 0;

    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);

    return rms / 255;
  }

  getMasterVU(): number {
    if (!this.masterAnalyser) return 0;

    const data = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getByteFrequencyData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const rms = Math.sqrt(sum / data.length);

    return rms / 255;
  }

  // -----------------------------
  // Mixer controls
  // -----------------------------
  setChannelGain(deckId: number, value: number) {
    const ch = this.mixerChannels.get(deckId);
    if (!ch) return;
    ch.gain.gain.value = value;
  }

  setChannelEq(deckId: number, band: "low" | "mid" | "high", value: number) {
    const ch = this.mixerChannels.get(deckId);
    if (!ch) return;

    if (band === "low") ch.low.gain.value = value;
    if (band === "mid") ch.mid.gain.value = value;
    if (band === "high") ch.high.gain.value = value;
  }

  setCompressor(deckId: number, amount: number) {
    return invoke("set_compressor", { deckId, amount });
  }

  setLimiter(deckId: number, amount: number) {
    return invoke("set_limiter", { deckId, amount });
  }

  setCrossfader(x: number) {
    if (!this.crossfaderLeft || !this.crossfaderRight) return;
    // Leave audio nodes completely open (unity gain = 1.0) 
    // because your React component handles individual channel level multipliers directly.
    this.crossfaderLeft.gain.value = 1.0;
    this.crossfaderRight.gain.value = 1.0;
  }

  // -----------------------------
  // Fade helpers (Deck.tsx)
  // -----------------------------
  fadeIn(deckId: number, durationSec: number = 1.0) {
    const ch = this.mixerChannels.get(deckId);
    const ctx = this.audioCtx;
    if (!ch || !ctx) return;

    const now = ctx.currentTime;
    ch.gain.gain.cancelScheduledValues(now);
    ch.gain.gain.setValueAtTime(0, now);
    ch.gain.gain.linearRampToValueAtTime(1, now + durationSec);
  }

  fadeOut(deckId: number, durationSec: number = 1.0) {
    const ch = this.mixerChannels.get(deckId);
    const ctx = this.audioCtx;
    if (!ch || !ctx) return;

    const now = ctx.currentTime;
    ch.gain.gain.cancelScheduledValues(now);
    ch.gain.gain.setValueAtTime(ch.gain.gain.value, now);
    ch.gain.gain.linearRampToValueAtTime(0, now + durationSec);
  }

  // -----------------------------
  // Settings
  // -----------------------------
  setAudioOutput(deviceId: string) {
    console.debug("Audio output set:", deviceId);
  }

  setAudioInput(deviceId: string) {
    console.debug("Audio input set:", deviceId);
  }

  setLatency(samples: number) {
    console.debug("Latency set:", samples);
  }

  setMidiEnabled(enabled: boolean) {
    console.debug("MIDI enabled:", enabled);
  }

  // -----------------------------
  // Pitch Bend
  // -----------------------------
  pitchBend(deckId: number, amount: number) {
  const baseRate = this.playbackRate.get(deckId) ?? 1.0;
  const newRate = baseRate + amount;

  // Update playbackRate map
  this.playbackRate.set(deckId, newRate);

  // Update stem sources
  const stemSources = this.stemSources.get(deckId);
  if (stemSources) {
    Object.values(stemSources).forEach((src) => {
      if (src) src.playbackRate.value = newRate;
    });
  }

  // Update track sources
  const trackSources = this.sources.get(deckId);
  if (trackSources) {
    trackSources.forEach((src) => {
      src.playbackRate.value = newRate;
    });
  }

  // Also notify backend (optional)
  invoke("set_tempo_cmd", { deckId, ratio: newRate });
}

syncDeck(deckId: number) {
  console.warn("syncDeck not implemented");
}

getFXState(deckId: number) {
  return { echo: 0, brake: 0 }; // or whatever shape you want
}

triggerAutoMix(deckId?: number) {
  console.warn("triggerAutoMix not implemented");
}

}

export const audioEngine = new AudioEngine();
