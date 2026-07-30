// src/utils/waveformRenderer.ts
export interface WaveformData {
  peaks: number[];
  length: number;
}

export function extractPeaks(
  audioBuffer: AudioBuffer,
  samples = 2000
): WaveformData {
  const raw = audioBuffer.getChannelData(0);
  const blockSize = Math.floor(raw.length / samples);
  const peaks: number[] = [];

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    let max = 0;

    for (let j = 0; j < blockSize; j++) {
      const value = Math.abs(raw[start + j]);
      if (value > max) max = value;
    }

    peaks.push(max);
  }

  return { peaks, length: audioBuffer.duration };
}

export function drawWaveform(
  canvas: HTMLCanvasElement,
  peaks: number[],
  zoom: number,
  scroll: number,
  playheadX: number,
  color = "#4ade80"
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const visiblePeaks = Math.floor(peaks.length / zoom);
  const startIndex = Math.floor(scroll * (peaks.length - visiblePeaks));
  const endIndex = startIndex + visiblePeaks;

  const slice = peaks.slice(startIndex, endIndex);
  const barWidth = width / slice.length;

  ctx.fillStyle = color;

  slice.forEach((peak, i) => {
    const barHeight = peak * height;
    const x = i * barWidth;
    const y = (height - barHeight) / 2;

    ctx.fillRect(x, y, barWidth, barHeight);
  });

  ctx.strokeStyle = "#f87171";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, height);
  ctx.stroke();
}
