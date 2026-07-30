// src/hooks/useSingerRotation.ts
import { invoke } from "@tauri-apps/api/core";
import { useShowState } from "../state/showState";
import { useSingerState, Singer } from "../state/singerState";
import { audioEngine } from "../engine/audioEngine";

const KARAOKE_DECK_ID = 1;

export function useSingerRotation() {
  const setSingers = useSingerState((s) => s.setSingers);

  // ---------------------------------------------------------
  // GET NEXT SINGER (pure rotation logic)
  // ---------------------------------------------------------
  const getNextSinger = (): Singer | null => {
    const { singers, activeSinger } = useSingerState.getState();

    if (!singers || singers.length === 0) return null;

    // activeSinger is an ID (string | number | null)
    const activeId = activeSinger;
    if (activeId == null) return singers[0];

    const idx = singers.findIndex((s) => s.id === activeId);
    if (idx === -1) return singers[0];

    return singers[(idx + 1) % singers.length];
  };

  // ---------------------------------------------------------
  // REFRESH SINGERS FROM RUST
  // ---------------------------------------------------------
  async function refreshSingers() {
    const list = await invoke<any[]>("singer_list");

    const normalized: Singer[] = list.map((s: any) => ({
      id: s.id ?? crypto.randomUUID(),
      name: s.name ?? "",
      song: s.song ?? null,
      notes: s.notes ?? null,
      addedAt: s.addedAt ?? Date.now(),
      onHold: s.onHold ?? false,
      requested_song: s.requested_song ?? undefined,
      request_count: s.request_count ?? 0,
      sung_count: s.sung_count ?? 0,
      favoriteSongs: s.favoriteSongs ?? [],
      performanceHistory: s.performanceHistory ?? [],
      stats: s.stats ?? {
        totalSongsSung: 0,
        averageWaitMs: 0,
        avgPitch: 0,
        avgTiming: 0,
        bestSong: null,
      },
      cdg_path: s.cdg_path ?? null,
      avgPitch: s.avgPitch ?? 0,
    }));

    setSingers(normalized);
  }

  // ---------------------------------------------------------
  // ADD / REMOVE / SET SONG
  // ---------------------------------------------------------
  async function addSinger(name: string, notes?: string): Promise<string> {
    const id = await invoke<number>("singer_add", { name });
    await refreshSingers();
    return id.toString();
  }

  async function removeSinger(id: string | number) {
    await invoke("singer_remove", { id });
    await refreshSingers();
  }

  async function setSingerSong(id: string | number, song: string) {
    await invoke("singer_set_song", { id, song });
    await refreshSingers();
  }

  async function loadSingerSongToDeck(singer: Singer, deckId: number) {
    // Update deck paths
    useShowState.getState().updateDeckPaths(
      deckId,
      singer.song ?? null,
      singer.cdg_path ?? null
    );

    // Load audio
    if (singer.song) {
      await audioEngine.loadTrack(deckId, singer.song);
    }

    // Load CDG
    if (singer.cdg_path) {
      await audioEngine.loadCDG(deckId, singer.cdg_path);
    }

    // Reset CDG position
    audioEngine.seekCDG(deckId, 0);
  }

  // ---------------------------------------------------------
  // ⭐ NEXT SINGER PIPELINE (manual advance)
  // ---------------------------------------------------------
  async function nextSinger(): Promise<Singer | null> {
    const { singers, activeSinger } = useSingerState.getState();

    if (!singers || singers.length === 0) return null;

    const activeId = activeSinger;
    const idx =
      activeId == null ? -1 : singers.findIndex((s) => s.id === activeId);

    const next =
      idx === -1 ? singers[0] : singers[(idx + 1) % singers.length];

    // Update active singer ID in SingerState
    useSingerState.getState().setActiveSinger(next.id);
    useShowState.getState().setCurrentSinger(KARAOKE_DECK_ID, next.id);

    // Rotation history for previous singer
    if (activeId != null) {
      const prev = singers.find((s) => s.id === activeId);
      if (prev && prev.song) {
        await addHistoryEntry(prev.name, prev.song);
        await incrementSung(Number(prev.id));
     }
    // ALWAYS load next singer's song
    await loadSingerSongToDeck(next, KARAOKE_DECK_ID);
    }

    return next;
  }

  // ---------------------------------------------------------
  // GET ACTIVE SINGER (ShowModeScreen uses this)
  // ---------------------------------------------------------
  function getActiveSinger(deckId: number): Singer | null {
    const show = useShowState.getState();
    const deck = show.decks.find((d) => d.id === deckId);
    if (!deck || deck.current_singer_id == null) return null;

    const singerId = deck.current_singer_id;

    return (
      useSingerState
        .getState()
        .singers.find((s) => s.id === singerId) || null
    );
  }

  // ---------------------------------------------------------
  // HISTORY
  // ---------------------------------------------------------
  async function getHistory() {
    return await invoke("singer_get_history");
  }

  async function addHistoryEntry(singer: string, song: string) {
    await invoke("singer_add_history", { singer, song });
  }

  async function incrementSung(id: number) {
    await invoke("singer_increment_sung", { id });
    await refreshSingers();
  }

  async function clearHistory() {
    await invoke("singer_clear_history");
  }

  const peekNextSinger = (): Singer | null => {
    const { singers, activeSinger } = useSingerState.getState();
    if (!singers || singers.length === 0) return null;

    const activeId = activeSinger;
    if (activeId == null) return singers[0];

    const idx = singers.findIndex((s) => s.id === activeId);
    if (idx === -1) return singers[0];

    return singers[(idx + 1) % singers.length];
  };

  return {
    addSinger,
    removeSinger,
    setSingerSong,
    nextSinger,
    peekNextSinger,
    getNextSinger,
    getActiveSinger,
    getHistory,
    addHistoryEntry,
    incrementSung,
    clearHistory,
    refreshSingers,
  };
}
