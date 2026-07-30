// src/engine/recordingEngine.ts
import { audioEngine } from "./audioEngine";
import { writeFile, BaseDirectory } from "@tauri-apps/plugin-fs";

class RecordingEngine {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private isRecording = false;

  start() {
    if (this.isRecording) return;

    const ctx = (audioEngine as any).audioCtx as AudioContext;
    if (!ctx) return;

    const dest = ctx.createMediaStreamDestination();

    // connect master output → recorder
    const audioCtx = audioEngine as any;
    if (audioCtx.masterGain) {
      audioCtx.masterGain.connect(dest);
    }

    this.mediaRecorder = new MediaRecorder(dest.stream);
    this.chunks = [];

    this.mediaRecorder.ondataavailable = (e) => {
      this.chunks.push(e.data);
    };

    this.mediaRecorder.onstop = async () => {
      const blob = new Blob(this.chunks, { type: "audio/wav" });
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      const filename = `recording_${Date.now()}.wav`;

      await writeFile(filename, bytes, { baseDir: BaseDirectory.Desktop });
    };

    this.mediaRecorder.start();
    this.isRecording = true;
  }

  stop() {
    if (!this.isRecording || !this.mediaRecorder) return;
    this.mediaRecorder.stop();
    this.isRecording = false;
  }

  getStatus() {
    return this.isRecording;
  }
}

export const recordingEngine = new RecordingEngine();
