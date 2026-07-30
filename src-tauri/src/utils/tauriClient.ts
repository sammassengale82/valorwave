import { invoke } from "@tauri-apps/api/core";

export async function getOutputDevices(): Promise<string[]> {
  return invoke("get_output_devices");
}

export async function saveLayout(name: string, payload: string): Promise<void> {
  await invoke("save_layout", { layout: { name, payload } });
}

export async function loadLayout(): Promise<{ name: string; payload: string }> {
  return invoke("load_layout");
}
