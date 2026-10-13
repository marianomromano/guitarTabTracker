const MIN_BPM = 70;
const MAX_BPM = 180;
const HOP_HZ = 100;

export type BpmGuess = {
  bpm: number;
  offset: number;
};

const cache = new Map<string, BpmGuess>();

export function previewAudioUrl(previewUrl: string) {
  return `/api/preview?url=${encodeURIComponent(previewUrl)}`;
}

export async function analyzePreviewBpm(previewUrl: string): Promise<BpmGuess | null> {
  const cached = cache.get(previewUrl);
  if (cached) return cached;

  const response = await fetch(previewAudioUrl(previewUrl));
  if (!response.ok) return null;

  const bytes = await response.arrayBuffer();
  const AudioCtx =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  const context = new AudioCtx();
  try {
    const buffer = await context.decodeAudioData(bytes.slice(0));
    const guess = detectBpm(buffer);
    if (guess) cache.set(previewUrl, guess);
    return guess;
  } catch (error) {
    console.error(error);
    return null;
  } finally {
    void context.close();
  }
}

export function detectBpm(buffer: AudioBuffer): BpmGuess | null {
  const data = mixDown(buffer);
  if (data.length < buffer.sampleRate) return null;

  const hopSize = Math.max(1, Math.round(buffer.sampleRate / HOP_HZ));
  const hopSec = hopSize / buffer.sampleRate;
  const flux = onsetEnvelope(data, hopSize);
  if (flux.length < 32) return null;

  const minLag = Math.max(2, Math.round(60 / MAX_BPM / hopSec));
  const maxLag = Math.min(flux.length - 2, Math.round(60 / MIN_BPM / hopSec));
  if (maxLag <= minLag) return null;

  let bestLag = minLag;
  let bestScore = 0;
  const scores = new Map<number, number>();

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let corr = 0;
    let norm = 0;
    for (let i = 0; i < flux.length - lag; i += 1) {
      corr += flux[i] * flux[i + lag];
      norm += flux[i] * flux[i];
    }
    const score = norm > 0 ? corr / norm : 0;
    scores.set(lag, score);
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }

  if (bestScore < 0.08) return null;

  let bpm = 60 / (bestLag * hopSec);
  const halfLag = Math.round(bestLag * 2);
  const doubleLag = Math.round(bestLag / 2);
  const halfScore = scores.get(halfLag) ?? 0;
  const doubleScore = scores.get(doubleLag) ?? 0;

  if (bpm > 160 && halfScore > bestScore * 0.55) {
    bpm /= 2;
  } else if (bpm < 80 && doubleScore > bestScore * 0.7) {
    bpm *= 2;
  }

  bpm = Math.round(clamp(bpm, MIN_BPM, MAX_BPM));
  const offset = beatOffset(flux, hopSec, bpm);
  return { bpm, offset };
}

function mixDown(buffer: AudioBuffer) {
  const length = buffer.length;
  const mixed = new Float32Array(length);
  const channels = buffer.numberOfChannels;
  for (let channel = 0; channel < channels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) mixed[i] += data[i];
  }
  if (channels > 1) {
    const scale = 1 / channels;
    for (let i = 0; i < length; i += 1) mixed[i] *= scale;
  }
  return mixed;
}

function onsetEnvelope(samples: Float32Array, hopSize: number) {
  const count = Math.floor(samples.length / hopSize);
  const energy = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const start = i * hopSize;
    let sum = 0;
    for (let j = 0; j < hopSize; j += 1) {
      const value = samples[start + j];
      sum += value * value;
    }
    energy[i] = Math.sqrt(sum / hopSize);
  }

  const flux = new Float32Array(count);
  for (let i = 1; i < count; i += 1) {
    flux[i] = Math.max(0, energy[i] - energy[i - 1]);
  }
  return flux;
}

function beatOffset(flux: Float32Array, hopSec: number, bpm: number) {
  const period = 60 / bpm / hopSec;
  const bins = Math.max(1, Math.round(period));
  const votes = new Float32Array(bins);
  for (let i = 0; i < flux.length; i += 1) {
    votes[i % bins] += flux[i];
  }
  let peak = 0;
  for (let i = 1; i < bins; i += 1) {
    if (votes[i] > votes[peak]) peak = i;
  }
  return peak * hopSec;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
