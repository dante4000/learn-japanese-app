// Chromagram: a frame-by-frame map of how much energy sits in each of the 12
// pitch classes. This is the shared representation behind both key detection
// (average the whole song) and chord detection (average per beat).
//
// Two refinements make it robust on real recordings:
//   * tuning estimation — many tracks aren't at A440; we estimate the global
//     tuning offset and bin against it so a flat/sharp recording still lands on
//     the right pitch classes.
//   * energy gating — near-silent frames (intros, fades, gaps) are dropped from
//     the song average so normalised noise can't sway the key.

import { fft, hann } from "./fft";

export interface Chromagram {
  /** One Float32Array(12) per frame, L2-normalised. */
  frames: Float32Array[];
  /** Raw spectral energy (pre-normalisation) per frame, for gating. */
  energies: Float32Array;
  /** Centre time (seconds) of each frame. */
  times: Float32Array;
  frameSize: number;
  hop: number;
  /** Estimated tuning offset in semitones, ~[-0.5, 0.5]. */
  tuningOffset: number;
}

const A4 = 440;
const F_MIN = 55; // A1 — below this is mostly bass/rumble noise
const F_MAX = 2000; // ~B6 — above this harmonics smear pitch classes

/** Fractional MIDI value of an FFT bin (before tuning correction). */
function binMidi(k: number, sampleRate: number, frameSize: number): number {
  const f = (k * sampleRate) / frameSize;
  return 69 + 12 * Math.log2(f / A4);
}

/**
 * Estimate the recording's global tuning offset (in semitones) as the
 * magnitude-weighted circular mean of how far each bin's energy sits from the
 * nearest equal-tempered pitch. A cheap no-overlap pass keeps this fast.
 */
export function estimateTuning(
  samples: Float32Array,
  sampleRate: number,
  frameSize = 4096,
): number {
  const win = hann(frameSize);
  const half = frameSize >> 1;
  const re = new Float32Array(frameSize);
  const im = new Float32Array(frameSize);

  const kMin = Math.max(1, Math.floor((F_MIN * frameSize) / sampleRate));
  const kMax = Math.min(half, Math.ceil((F_MAX * frameSize) / sampleRate));

  // deviation of each bin from its nearest semitone, fixed per bin
  const dev = new Float32Array(kMax + 1);
  for (let k = kMin; k <= kMax; k++) {
    const m = binMidi(k, sampleRate, frameSize);
    dev[k] = m - Math.round(m); // [-0.5, 0.5]
  }

  let sumSin = 0;
  let sumCos = 0;
  const hop = frameSize; // no overlap — estimation tolerates coarse sampling
  for (let start = 0; start + frameSize <= samples.length; start += hop) {
    for (let i = 0; i < frameSize; i++) {
      re[i] = samples[start + i] * win[i];
      im[i] = 0;
    }
    fft(re, im);
    for (let k = kMin; k <= kMax; k++) {
      const mag = Math.hypot(re[k], im[k]);
      const angle = 2 * Math.PI * dev[k];
      sumSin += mag * Math.sin(angle);
      sumCos += mag * Math.cos(angle);
    }
  }
  if (sumSin === 0 && sumCos === 0) return 0;
  return Math.atan2(sumSin, sumCos) / (2 * Math.PI); // back to semitones
}

/**
 * Short-time Fourier transform → 12-bin chroma per frame. Each FFT bin in the
 * usable frequency band is folded onto its nearest (tuning-corrected) pitch
 * class; frames are L2-normalised so loud and quiet passages contribute equally.
 */
export function computeChromagram(
  samples: Float32Array,
  sampleRate: number,
  frameSize = 4096,
  hop = 2048,
  tuningOffset?: number,
): Chromagram {
  const offset = tuningOffset ?? estimateTuning(samples, sampleRate, frameSize);
  const win = hann(frameSize);
  const half = frameSize >> 1;

  // Precompute the tuning-corrected pitch class for every FFT bin once.
  const binPc = new Int8Array(half + 1).fill(-1);
  for (let k = 1; k <= half; k++) {
    const f = (k * sampleRate) / frameSize;
    if (f < F_MIN || f > F_MAX) continue;
    const midi = 69 + 12 * Math.log2(f / A4) - offset;
    binPc[k] = (((Math.round(midi) % 12) + 12) % 12) as number;
  }

  const frames: Float32Array[] = [];
  const times: number[] = [];
  const energies: number[] = [];
  const re = new Float32Array(frameSize);
  const im = new Float32Array(frameSize);

  for (let start = 0; start + frameSize <= samples.length; start += hop) {
    for (let i = 0; i < frameSize; i++) {
      re[i] = samples[start + i] * win[i];
      im[i] = 0;
    }
    fft(re, im);

    const chroma = new Float32Array(12);
    let energy = 0;
    for (let k = 1; k <= half; k++) {
      const pc = binPc[k];
      if (pc < 0) continue;
      const mag = Math.hypot(re[k], im[k]);
      chroma[pc] += mag;
      energy += mag;
    }

    // L2 normalise
    let norm = 0;
    for (let p = 0; p < 12; p++) norm += chroma[p] * chroma[p];
    norm = Math.sqrt(norm);
    if (norm > 0) for (let p = 0; p < 12; p++) chroma[p] /= norm;

    frames.push(chroma);
    energies.push(energy);
    times.push((start + half) / sampleRate);
  }

  return {
    frames,
    energies: Float32Array.from(energies),
    times: Float32Array.from(times),
    frameSize,
    hop,
    tuningOffset: offset,
  };
}

/** Mean of a set of chroma frames, returned as a plain 12-length array. */
export function averageChroma(frames: Float32Array[]): number[] {
  const avg = new Array(12).fill(0);
  if (frames.length === 0) return avg;
  for (const f of frames) for (let p = 0; p < 12; p++) avg[p] += f[p];
  for (let p = 0; p < 12; p++) avg[p] /= frames.length;
  return avg;
}

/**
 * Song-level chroma for key detection: averages only frames with enough energy
 * so silent/near-silent passages can't inject normalised noise.
 */
export function songChroma(cg: Chromagram): number[] {
  const n = cg.frames.length;
  if (n === 0) return new Array(12).fill(0);
  let maxE = 0;
  for (let i = 0; i < n; i++) if (cg.energies[i] > maxE) maxE = cg.energies[i];
  const gate = maxE * 0.1;
  const avg = new Array(12).fill(0);
  let used = 0;
  for (let i = 0; i < n; i++) {
    if (cg.energies[i] < gate) continue;
    const f = cg.frames[i];
    for (let p = 0; p < 12; p++) avg[p] += f[p];
    used++;
  }
  if (used === 0) return averageChroma(cg.frames);
  for (let p = 0; p < 12; p++) avg[p] /= used;
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
