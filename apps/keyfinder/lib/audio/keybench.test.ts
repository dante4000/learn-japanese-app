// Realistic key-detection benchmark: synthesize diatonic chord progressions
// (with harmonics + bass, the way real recordings leak energy into fifths and
// thirds) for all 24 keys, run them through the REAL chromagram -> key pipeline,
// and measure accuracy. This is how we know the key finder is actually good,
// not just correct on clean one-hot vectors.

import { describe, it, expect } from "vitest";
import { computeChromagram, songChroma } from "./chroma";
import { detectKeyFromChroma } from "./key";

const SR = 22050;

// midi -> Hz
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// One chord rendered as tones with a handful of harmonics + an octave-down
// bass, under a short attack/decay envelope.
function renderChord(midis: number[], seconds: number, detuneCents = 0): Float32Array {
  const n = Math.floor(seconds * SR);
  const out = new Float32Array(n);
  const partials = [1, 0.5, 0.33, 0.22, 0.16, 0.12]; // 1/h-ish rolloff
  const voices = [...midis, midis[0] - 12]; // add bass root
  for (const m of voices) {
    const f0 = mtof(m) * Math.pow(2, detuneCents / 1200);
    for (let h = 0; h < partials.length; h++) {
      const f = f0 * (h + 1);
      if (f > SR / 2) break;
      const amp = partials[h];
      for (let i = 0; i < n; i++) {
        out[i] += amp * Math.sin((2 * Math.PI * f * i) / SR);
      }
    }
  }
  // simple AD envelope so chord boundaries look like note onsets
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = t < 0.05 ? t / 0.05 : Math.max(0, 1 - (t - 0.05) * 0.8);
    out[i] *= env;
  }
  return out;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

// triad (root/third/fifth) of a scale degree, voiced around middle C
function triad(rootPc: number, scale: number[], degree: number): number[] {
  const baseMidi = 60 + rootPc;
  return [0, 2, 4].map((step) => {
    const sd = scale[(degree + step) % 7];
    const oct = Math.floor((degree + step) / 7);
    return baseMidi + sd + 12 * oct;
  });
}

// A progression of scale-degree triads. `degrees` lets us test cadential
// (tonic-anchored) vs pop (non-tonic-start) orderings.
function progression(
  rootPc: number,
  mode: "major" | "minor",
  opts: { detune?: number; degrees?: number[]; noise?: number; melody?: boolean } = {},
): Float32Array {
  const { detune = 0, noise = 0, melody = false } = opts;
  const scale = mode === "major" ? MAJOR : MINOR;
  const degrees = opts.degrees ?? [0, 3, 4, 0, 5, 3, 4, 0];
  const chunks = degrees.map((d) => {
    const c = renderChord(triad(rootPc, scale, d), 0.9, detune);
    if (melody) {
      // a melody line wandering over the scale, an octave up — emphasises
      // non-tonic tones to make sure we key off harmony, not the top voice
      const melodyDegs = [1, 5, 4, 6, 2, 3, 5, 1];
      const md = melodyDegs[(d * 3 + 1) % melodyDegs.length];
      const mel = renderChord([60 + rootPc + scale[md % 7] + 12], 0.9, detune);
      for (let i = 0; i < c.length; i++) c[i] += 0.7 * mel[i];
    }
    return c;
  });
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Float32Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  if (noise > 0) {
    // deterministic pseudo-noise (no Math.random in this env) + periodic
    // broadband "drum" hits to simulate percussion energy
    let seed = 1234567;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff - 0.5;
    };
    const beat = Math.floor(0.45 * SR);
    for (let i = 0; i < out.length; i++) {
      out[i] += noise * rnd();
      if (i % beat < 600) out[i] += noise * 3 * rnd() * Math.exp(-(i % beat) / 200);
    }
  }
  return out;
}

const NOTE = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const label = (pc: number, mode: string) => `${NOTE[pc]} ${mode}`;
const isRelative = (gotPc: number, gotMode: string, pc: number, mode: string) => {
  if (mode === "major" && gotMode === "minor") return gotPc === (pc + 9) % 12;
  if (mode === "minor" && gotMode === "major") return gotPc === (pc + 3) % 12;
  return false;
};

type Opts = Parameters<typeof progression>[2];

function scoreCondition(name: string, opts: Opts): { exact: number; rel: number } {
  let exact = 0;
  let rel = 0;
  const misses: string[] = [];
  for (const mode of ["major", "minor"] as const) {
    for (let pc = 0; pc < 12; pc++) {
      const audio = progression(pc, mode, opts);
      const cg = computeChromagram(audio, SR);
      const key = detectKeyFromChroma(songChroma(cg));
      if (key.rootPc === pc && key.mode === mode) exact++;
      else if (isRelative(key.rootPc, key.mode, pc, mode)) {
        rel++;
        misses.push(`  ${label(pc, mode)} -> ${label(key.rootPc, key.mode)} (rel)`);
      } else {
        misses.push(`  ${label(pc, mode)} -> ${label(key.rootPc, key.mode)} (WRONG)`);
      }
    }
  }
  // eslint-disable-next-line no-console
  console.log(`\n[${name}] exact ${exact}/24, +rel ${rel}\n${misses.join("\n")}`);
  return { exact, rel };
}

describe("key detection accuracy (synthetic, with harmonics)", () => {
  it("clean cadential progressions across all 24 keys", () => {
    expect(scoreCondition("clean", {}).exact).toBe(24);
  });

  it("survives tuning offsets (±40 cents)", () => {
    expect(scoreCondition("detune +40c", { detune: 40 }).exact).toBeGreaterThanOrEqual(23);
    expect(scoreCondition("detune -40c", { detune: -40 }).exact).toBeGreaterThanOrEqual(23);
  });

  it("survives percussion + broadband noise", () => {
    expect(scoreCondition("noisy", { noise: 0.25 }).exact).toBeGreaterThanOrEqual(23);
  });

  it("keys off harmony, not a busy top-line melody", () => {
    expect(scoreCondition("melody", { melody: true }).exact).toBeGreaterThanOrEqual(23);
  });

  it("handles pop progressions that don't start on the tonic (vi IV I V)", () => {
    const major = [5, 3, 0, 4, 5, 3, 0, 4];
    expect(scoreCondition("pop vi-IV-I-V", { degrees: major }).exact).toBeGreaterThanOrEqual(22);
  });

  it("survives noise and detuning together", () => {
    expect(
      scoreCondition("noisy +detune", { noise: 0.2, detune: 30 }).exact,
    ).toBeGreaterThanOrEqual(22);
  });
});
