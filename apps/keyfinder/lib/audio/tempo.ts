// Tempo + beat grid via a spectral-flux onset envelope and autocorrelation.
//
// 1. Spectral flux: sum of positive frame-to-frame magnitude increases — peaks
//    where new energy (a note/drum hit) appears.
// 2. Autocorrelation of that envelope over the plausible tempo range finds the
//    dominant periodicity = tempo.
// 3. A phase search aligns a click grid to the envelope = beat timestamps.

import { fft, hann } from "./fft";

export interface TempoResult {
  bpm: number;
  beats: number[]; // beat onset times in seconds
}

const MIN_BPM = 70;
const MAX_BPM = 180;

function onsetEnvelope(
  samples: Float32Array,
  sampleRate: number,
  frameSize: number,
  hop: number,
): { env: Float32Array; rate: number } {
  const win = hann(frameSize);
  const half = frameSize >> 1;
  const re = new Float32Array(frameSize);
  const im = new Float32Array(frameSize);
  let prev = new Float32Array(half + 1);
  const flux: number[] = [];

  for (let start = 0; start + frameSize <= samples.length; start += hop) {
    for (let i = 0; i < frameSize; i++) {
      re[i] = samples[start + i] * win[i];
      im[i] = 0;
    }
    fft(re, im);

    const mag = new Float32Array(half + 1);
    let f = 0;
    for (let k = 0; k <= half; k++) {
      const m = Math.hypot(re[k], im[k]);
      mag[k] = m;
      const d = m - prev[k];
      if (d > 0) f += d;
    }
    flux.push(f);
    prev = mag;
  }

  // Remove the slow-moving baseline so steady tones don't dominate beats.
  const env = Float32Array.from(flux);
  const w = 8;
  const smoothed = new Float32Array(env.length);
  for (let i = 0; i < env.length; i++) {
    let s = 0;
    let c = 0;
    for (let j = i - w; j <= i + w; j++) {
      if (j >= 0 && j < env.length) {
        s += env[j];
        c++;
      }
    }
    smoothed[i] = Math.max(0, env[i] - s / c);
  }
  return { env: smoothed, rate: sampleRate / hop };
}

/** Fold a tempo into the [MIN_BPM, MAX_BPM) range by octave halving/doubling. */
function foldTempo(bpm: number): number {
  let b = bpm;
  while (b < MIN_BPM) b *= 2;
  while (b >= MAX_BPM) b /= 2;
  return b;
}

export function detectTempo(
  samples: Float32Array,
  sampleRate: number,
  frameSize = 2048,
  hop = 512,
): TempoResult {
  const { env, rate } = onsetEnvelope(samples, sampleRate, frameSize, hop);
  if (env.length < 4) return { bpm: 0, beats: [] };

  // Autocorrelation across lags covering the tempo range. A mild bias toward
  // ~120 BPM resolves the common octave ambiguity in favour of a human tempo.
  const minLag = Math.floor((rate * 60) / MAX_BPM);
  const maxLag = Math.ceil((rate * 60) / MIN_BPM);
  let bestLag = minLag;
  let bestVal = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = lag; i < env.length; i++) s += env[i] * env[i - lag];
    const lagBpm = (rate * 60) / lag;
    const bias = 1 - Math.abs(Math.log2(lagBpm / 120)) * 0.15;
    s *= bias;
    if (s > bestVal) {
      bestVal = s;
      bestLag = lag;
    }
  }

  const bpm = foldTempo((rate * 60) / bestLag);
  const beatPeriod = (60 / bpm) * rate; // in envelope frames

  // Phase search: slide a click grid and keep the offset with the most energy.
  let bestOffset = 0;
  let bestScore = -Infinity;
  for (let off = 0; off < beatPeriod; off += 1) {
    let s = 0;
    for (let pos = off; pos < env.length; pos += beatPeriod) {
      s += env[Math.round(pos)] ?? 0;
    }
    if (s > bestScore) {
      bestScore = s;
      bestOffset = off;
    }
  }

  const beats: number[] = [];
  for (let pos = bestOffset; pos < env.length; pos += beatPeriod) {
    beats.push(pos / rate);
  }

  return { bpm: Math.round(bpm), beats };
}
