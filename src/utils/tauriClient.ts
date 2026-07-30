import { invoke } from "@tauri-apps/api/core";

export async function saveLayout(name: string, payload: string) {
  return await invoke("save_layout", {
    layout: { name, payload },
  });
}

export async function loadLayout(): Promise<{ name: string; payload: string }> {
  return await invoke("load_layout");
}
