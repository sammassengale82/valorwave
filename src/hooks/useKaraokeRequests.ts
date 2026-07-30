import { invoke } from "@tauri-apps/api/core";

export function useKaraokeRequests() {
  async function addRequest(name: string, song: string) {
    return await invoke<number>("request_add", { name, song });
  }

  async function approveRequest(id: number) {
    return await invoke<any>("request_approve", { id });
  }

  async function declineRequest(id: number) {
    await invoke("request_decline", { id });
  }

  async function listRequests() {
    return await invoke<any[]>("request_list");
  }

  return {
    addRequest,
    approveRequest,
    declineRequest,
    listRequests,
  };
}
