import { invoke } from "@tauri-apps/api/core";

export interface Metrics {
  cpu: number;
  gpu: number;
  latency: number;
}

export async function fetchMetrics(): Promise<Metrics> {
  return invoke("get_system_metrics");
}
