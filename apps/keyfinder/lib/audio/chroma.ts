// Chromagram: a frame-by-frame map of how much energy sits in each of the 12
// pitch classes. This is the shared representation behind both key detection
// (average the whole song) and chord detection (average per beat).

import { fft, hann } from "./fft";

export interface Chromagram {
  /** One Float32Array(12) per frame, L2-normalised. */
  frames: Float32Array[];
  /** Centre time (seconds) of each frame. */
  times: Float32Array;
  frameSize: number;
  hop: number;
}

const A4 = 440;
const F_MIN = 55; // A1 — below this is mostly bass/rumble noise
const F_MAX = 2000; // ~B6 — above this harmonics smear pitch classes

/**
 * Short-time Fourier transform → 12-bin chroma per frame. Each FFT bin in the
 * usable frequency band is folded onto its nearest pitch class; frames are
 * L2-normalised so loud and quiet passages contribute equally to harmony.
 */
export function computeChromagram(
  samples: Float32Array,
  sampleRate: number,
  frameSize = 4096,
  hop = 2048,
): Chromagram {
  const win = hann(frameSize);
  const half = frameSize >> 1;

  // Precompute the pitch class for every FFT bin once.
  const binPc = new Int8Array(half + 1).fill(-1);
  for (let k = 1; k <= half; k++) {
    const f = (k * sampleRate) / frameSize;
    if (f < F_MIN || f > F_MAX) continue;
    const midi = 69 + 12 * Math.log2(f / A4);
    binPc[k] = (((Math.round(midi) % 12) + 12) % 12) as number;
  }

  const frames: Float32Array[] = [];
  const times: number[] = [];
  const re = new Float32Array(frameSize);
  const im = new Float32Array(frameSize);

  for (let start = 0; start + frameSize <= samples.length; start += hop) {
    for (let i = 0; i < frameSize; i++) {
      re[i] = samples[start + i] * win[i];
      im[i] = 0;
    }
    fft(re, im);

    const chroma = new Float32Array(12);
    for (let k = 1; k <= half; k++) {
      const pc = binPc[k];
      if (pc < 0) continue;
      chroma[pc] += Math.hypot(re[k], im[k]);
    }

    // L2 normalise
    let norm = 0;
    for (let p = 0; p < 12; p++) norm += chroma[p] * chroma[p];
    norm = Math.sqrt(norm);
    if (norm > 0) for (let p = 0; p < 12; p++) chroma[p] /= norm;

    frames.push(chroma);
    times.push((start + half) / sampleRate);
  }

  return { frames, times: Float32Array.from(times), frameSize, hop };
}

/** Mean of a set of chroma frames, returned as a plain 12-length array. */
export function averageChroma(frames: Float32Array[]): number[] {
  const avg = new Array(12).fill(0);
  if (frames.length === 0) return avg;
  for (const f of frames) for (let p = 0; p < 12; p++) avg[p] += f[p];
  for (let p = 0; p < 12; p++) avg[p] /= frames.length;
  return avg;
}

/** Mean chroma over the frames whose centre time falls in [t0, t1). */
export function chromaInWindow(cg: Chromagram, t0: number, t1: number): Float32Array {
  const acc = new Float32Array(12);
  let count = 0;
  for (let i = 0; i < cg.frames.length; i++) {
    const t = cg.times[i];
    if (t >= t0 && t < t1) {
      const f = cg.frames[i];
      for (let p = 0; p < 12; p++) acc[p] += f[p];
      count++;
    }
  }
  if (count > 0) for (let p = 0; p < 12; p++) acc[p] /= count;
  return acc;
}
