export interface Beatgrid {
  bpm: number;
  beats: number[]; // seconds
}

export async function analyzeBPM(
  audioBuffer: AudioBuffer
): Promise<Beatgrid> {
  const raw = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;

  const frameSize = 1024;
  const hop = 512;
  const energies: number[] = [];

  for (let i = 0; i < raw.length - frameSize; i += hop) {
    let sum = 0;
    for (let j = 0; j < frameSize; j++) {
      const v = raw[i + j];
      sum += v * v;
    }
    energies.push(sum);
  }

  const maxLag = Math.floor(sampleRate * 1.5);
  const minLag = Math.floor(sampleRate * 0.25);

  let bestLag = minLag;
  let bestCorr = 0;

  for (let lag = minLag; lag < maxLag; lag += 20) {
    let corr = 0;
    for (let i = 0; i < energies.length - lag; i++) {
      corr += energies[i] * energies[i + lag];
    }
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }

  const bpm = 60 / (bestLag / sampleRate);

  const beats: number[] = [];
  const beatInterval = 60 / bpm;
  let t = 0;
  while (t < audioBuffer.duration) {
    beats.push(t);
    t += beatInterval;
  }

  return { bpm, beats };
}
