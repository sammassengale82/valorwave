// useCDGPlayer.ts
import { useEffect, useRef } from "react";
import { readFile } from "@tauri-apps/plugin-fs";
import { CDGDecoder } from "./cdgDecoder";
import { CDGRenderer } from "./cdgRenderer";
import { getAllWindows } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

export function useCDGPlayer(deckId: number, fallbackCanvas: HTMLCanvasElement | null) {
  const decoderRef = useRef<CDGDecoder | null>(null);
  const rendererRef = useRef<CDGRenderer | null>(null);
  const packetsRef = useRef<any[]>([]);
  const startTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(fallbackCanvas);

  // 🔥 NEW: Try to locate karaoke window canvas
  async function resolveCanvas() {
    const windows = await getAllWindows();
    const karaokeWin = windows.find((w) => w.label === "karaoke_screen");

    if (karaokeWin) {
      const el = document.getElementById("cdg-output") as HTMLCanvasElement | null;
      if (el) {
        canvasRef.current = el;
        rendererRef.current = new CDGRenderer(el);
        return;
      }
    }

    // fallback to deck preview canvas
    if (fallbackCanvas) {
      canvasRef.current = fallbackCanvas;
      rendererRef.current = new CDGRenderer(fallbackCanvas);
    }
  }

  // 🔥 NEW: Re-check canvas whenever windows open/close
  useEffect(() => {
    resolveCanvas();
    const unlisten1 = listen("tauri://window-created", resolveCanvas);
    const unlisten2 = listen("tauri://window-destroyed", resolveCanvas);

    return () => {
      unlisten1.then((fn) => fn());
      unlisten2.then((fn) => fn());
    };
  }, []);

  // Initialize renderer for fallback canvas
  useEffect(() => {
    if (fallbackCanvas) {
      rendererRef.current = new CDGRenderer(fallbackCanvas);
    }
  }, [fallbackCanvas]);

  async function loadCDG(path: string) {
    const file = await readFile(path);
    const decoder = new CDGDecoder();
    packetsRef.current = decoder.decode(file.buffer);
    decoderRef.current = decoder;

    await resolveCanvas();
  }

  function start(positionSeconds: number) {
    startTimeRef.current = performance.now() - positionSeconds * 1000;
    requestAnimationFrame(tick);
  }

  function tick() {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const packetIndex = Math.floor(elapsed * 300); // CDG = 300 packets/sec
    const packets = packetsRef.current;

    if (packetIndex < packets.length) {
      renderer.applyPacket(packets[packetIndex]);
      requestAnimationFrame(tick);
    }
  }

  function seek(seconds: number) {
    start(seconds);
  }

  return {
    loadCDG,
    start,
    seek,
  };
}
