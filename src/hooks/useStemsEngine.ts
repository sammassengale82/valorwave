// src/hooks/useStemsEngine.ts
import { useRef } from "react";
import { InferenceSession, Tensor } from "onnxruntime-web";
import { invoke } from "@tauri-apps/api/core";

type StemName = "vocal" | "drums" | "bass" | "other";

export function useStemsEngine() {
  const modelRef = useRef<InferenceSession | null>(null);

  async function loadModel(): Promise<InferenceSession> {
    if (!modelRef.current) {
      modelRef.current = await InferenceSession.create("models/mdx_light.onnx");
    }
    return modelRef.current;
  }

  const loadStems = (
    deckId: number,
    stems: Partial<Record<StemName, string>>
  ) => {
    return invoke("load_stems", { deck_id: deckId, stems });
  };

  const setStemsEnabled = (deckId: number, enabled: boolean) => {
    return invoke("set_stems_enabled", { deck_id: deckId, enabled });
  };

  const setStemGains = (deckId: number, gains: any) => {
    return invoke("set_stem_gains", { deck_id: deckId, gains });
  };

  const getStemsState = (deckId: number) => {
    return invoke("get_stems_state", { deck_id: deckId });
  };

  async function separateStems(audioBuffer: AudioBuffer) {
    const model = await loadModel();

    const raw = audioBuffer.getChannelData(0);
    const inputTensor = new Tensor("float32", raw, [1, raw.length]);

    const output = await model.run({ input: inputTensor });

    const toFloat32 = (data: unknown): Float32Array =>
      data instanceof Float32Array ? data : new Float32Array(data as any);

    return {
      vocal: toFloat32((output as any).vocal.data),
      drums: toFloat32((output as any).drums.data),
      bass: toFloat32((output as any).bass.data),
      other: toFloat32((output as any).other.data),
    };
  }

  async function createStemBuffers(
    ctx: AudioContext,
    stems: Record<StemName, Float32Array>
  ) {
    const makeBuffer = (data: Float32Array) => {
      const buf = ctx.createBuffer(1, data.length, ctx.sampleRate);
      buf.copyToChannel(new Float32Array(data), 0);
      return buf;
    };

    return {
      vocal: makeBuffer(stems.vocal),
      drums: makeBuffer(stems.drums),
      bass: makeBuffer(stems.bass),
      other: makeBuffer(stems.other),
    };
  }

  return {
    loadStems,
    setStemsEnabled,
    setStemGains,
    getStemsState,
    separateStems,
    createStemBuffers,
  };
}
