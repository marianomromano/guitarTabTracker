export type TunerString = {
  id: string;
  label: string;
  note: string;
  frequency: number;
};

export type InstrumentPreset = {
  id: "guitar" | "bass-4" | "bass-5";
  name: string;
  group: "guitar" | "bass";
  minHz: number;
  maxHz: number;
  strings: TunerString[];
};

export const INSTRUMENTS: InstrumentPreset[] = [
  {
    id: "guitar",
    name: "Guitar",
    group: "guitar",
    minHz: 70,
    maxHz: 420,
    strings: [
      { id: "e2", label: "6", note: "E2", frequency: 82.41 },
      { id: "a2", label: "5", note: "A2", frequency: 110.0 },
      { id: "d3", label: "4", note: "D3", frequency: 146.83 },
      { id: "g3", label: "3", note: "G3", frequency: 196.0 },
      { id: "b3", label: "2", note: "B3", frequency: 246.94 },
      { id: "e4", label: "1", note: "E4", frequency: 329.63 },
    ],
  },
  {
    id: "bass-4",
    name: "Bass · 4",
    group: "bass",
    minHz: 28,
    maxHz: 140,
    strings: [
      { id: "e1", label: "4", note: "E1", frequency: 41.2 },
      { id: "a1", label: "3", note: "A1", frequency: 55.0 },
      { id: "d2", label: "2", note: "D2", frequency: 73.42 },
      { id: "g2", label: "1", note: "G2", frequency: 98.0 },
    ],
  },
  {
    id: "bass-5",
    name: "Bass · 5",
    group: "bass",
    minHz: 26,
    maxHz: 140,
    strings: [
      { id: "b0", label: "5", note: "B0", frequency: 30.87 },
      { id: "e1", label: "4", note: "E1", frequency: 41.2 },
      { id: "a1", label: "3", note: "A1", frequency: 55.0 },
      { id: "d2", label: "2", note: "D2", frequency: 73.42 },
      { id: "g2", label: "1", note: "G2", frequency: 98.0 },
    ],
  },
];

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function centsOff(frequency: number, target: number) {
  return 1200 * Math.log2(frequency / target);
}

export function closestString(frequency: number, strings: TunerString[]) {
  let best = strings[0];
  let bestCents = Infinity;
  for (const string of strings) {
    const cents = Math.abs(centsOff(frequency, string.frequency));
    if (cents < bestCents) {
      best = string;
      bestCents = cents;
    }
  }
  return { string: best, cents: centsOff(frequency, best.frequency) };
}

export function noteFromFrequency(frequency: number) {
  const midi = Math.round(12 * Math.log2(frequency / 440) + 69);
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  const target = 440 * 2 ** ((midi - 69) / 12);
  return {
    name,
    octave,
    label: `${name}${octave}`,
    cents: centsOff(frequency, target),
  };
}

export function rmsLevel(buffer: ArrayLike<number>) {
  const size = buffer.length;
  if (size === 0) return 0;
  let total = 0;
  for (let i = 0; i < size; i += 1) {
    total += buffer[i] * buffer[i];
  }
  return Math.sqrt(total / size);
}

export function detectPitch(
  buffer: ArrayLike<number>,
  sampleRate: number,
  minHz: number,
  maxHz: number,
  rms = rmsLevel(buffer),
) {
  // Laptop mics are quiet with AGC off; 0.008 was dropping real guitar notes.
  if (rms < 0.0012) return null;

  const size = buffer.length;
  const tauMin = Math.max(2, Math.floor(sampleRate / maxHz));
  const tauMax = Math.min(Math.floor(sampleRate / minHz), size - 2);
  if (tauMax <= tauMin) return null;

  const yin = new Float32Array(tauMax + 1);
  yin[0] = 1;
  let runningSum = 0;

  for (let tau = 1; tau <= tauMax; tau += 1) {
    let sum = 0;
    const limit = size - tau;
    for (let i = 0; i < limit; i += 1) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    runningSum += sum;
    yin[tau] = runningSum === 0 ? 1 : (sum * tau) / runningSum;
  }

  const threshold = 0.12;
  let tauEstimate = -1;
  for (let tau = tauMin; tau < tauMax; tau += 1) {
    if (yin[tau] < threshold) {
      while (tau + 1 < tauMax && yin[tau + 1] < yin[tau]) tau += 1;
      tauEstimate = tau;
      break;
    }
  }

  if (tauEstimate === -1) {
    let minVal = 1;
    for (let tau = tauMin; tau < tauMax; tau += 1) {
      if (yin[tau] < minVal) {
        minVal = yin[tau];
        tauEstimate = tau;
      }
    }
    if (minVal > 0.35) return null;
  }

  const x0 = Math.max(tauEstimate - 1, 0);
  const x2 = Math.min(tauEstimate + 1, tauMax);
  let betterTau = tauEstimate;
  if (x0 !== tauEstimate && x2 !== tauEstimate) {
    const s0 = yin[x0];
    const s1 = yin[tauEstimate];
    const s2 = yin[x2];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) {
      betterTau = tauEstimate + (s2 - s0) / denom;
    }
  }

  const frequency = sampleRate / betterTau;
  if (!Number.isFinite(frequency) || frequency < minHz || frequency > maxHz) {
    return null;
  }
  return frequency;
}
