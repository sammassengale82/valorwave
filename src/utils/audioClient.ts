import { invoke } from "@tauri-apps/api/core";

export async function getLatency(): Promise<number> {
  const res = await invoke<{ ms: number }>("get_audio_latency");
  return res.ms;
}
