// Chord recognition: average chroma over each beat, match against major /
// minor / dominant-7th templates by cosine similarity, smooth out one-beat
// flickers, then merge equal neighbours into timed segments.

import { getKey } from "../theory";
import { chromaInWindow, type Chromagram } from "./chroma";
import type { DetectedKey } from "./key";

export type ChordQuality = "maj" | "min" | "7";

export interface ChordSegment {
  startTime: number;
  endTime: number;
  rootPc: number;
  quality: ChordQuality;
  label: string; // "Am", "G7", "C"
  pcs: number[]; // pitch classes in the voicing, root first
  confidence: number; // 0..100
}

const QUALITY_INTERVALS: Record<ChordQuality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  "7": [0, 4, 7, 10],
};

const SUFFIX: Record<ChordQuality, string> = { maj: "", min: "m", "7": "7" };

/** Pitch classes of a chord, root first. */
export function chordPitchClasses(rootPc: number, quality: ChordQuality): number[] {
  return QUALITY_INTERVALS[quality].map((iv) => (rootPc + iv) % 12);
}

interface Template {
  rootPc: number;
  quality: ChordQuality;
  vec: Float32Array; // unit-norm 12-vector
}

const TEMPLATES: Template[] = (() => {
  const list: Template[] = [];
  for (let root = 0; root < 12; root++) {
    for (const quality of ["maj", "min", "7"] as ChordQuality[]) {
      const ivs = QUALITY_INTERVALS[quality];
      const vec = new Float32Array(12);
      for (const iv of ivs) vec[(root + iv) % 12] = 1;
      const norm = Math.sqrt(ivs.length);
      for (let i = 0; i < 12; i++) vec[i] /= norm;
      list.push({ rootPc: root, quality, vec });
    }
  }
  return list;
})();

function bestTemplate(chroma: Float32Array): { tmpl: Template; score: number } {
  // L2 normalise the observed chroma so the dot product is a cosine similarity.
  let norm = 0;
  for (let p = 0; p < 12; p++) norm += chroma[p] * chroma[p];
  norm = Math.sqrt(norm);
  let best = TEMPLATES[0];
  let bestScore = -Infinity;
  if (norm === 0) return { tmpl: best, score: 0 };
  for (const t of TEMPLATES) {
    let dot = 0;
    for (let p = 0; p < 12; p++) dot += chroma[p] * t.vec[p];
    const score = dot / norm;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return { tmpl: best, score: bestScore };
}

// pc -> nicely spelled note name, in the context of the detected key.
function buildSpeller(key: DetectedKey): (pc: number) => string {
  const info = getKey(key.rootPc, key.mode);
  const inKey = new Map<number, string>();
  for (const n of info.scale) inKey.set(n.pc, n.name);
  const useFlats = info.signature.type === "flat";
  const SHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  const FLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
  return (pc) => inKey.get(pc) ?? (useFlats ? FLAT : SHARP)[pc];
}

/** Classify a single chroma vector into the best-matching chord template. */
export function classifyChord(chroma: ArrayLike<number>): {
  rootPc: number;
  quality: ChordQuality;
  score: number;
} {
  const arr = chroma instanceof Float32Array ? chroma : Float32Array.from(chroma);
  const { tmpl, score } = bestTemplate(arr);
  return { rootPc: tmpl.rootPc, quality: tmpl.quality, score };
}

interface BeatChord {
  rootPc: number;
  quality: ChordQuality;
  score: number;
  t0: number;
  t1: number;
}

/**
 * Detect chords across a song. Uses the beat grid when available, otherwise a
 * fixed 0.5s window. Returns merged, time-stamped chord segments.
 */
export function detectChords(
  cg: Chromagram,
  beats: number[],
  key: DetectedKey,
  duration: number,
): ChordSegment[] {
  // Build analysis windows.
  const bounds: number[] =
    beats.length >= 2 ? [...beats, duration] : fixedGrid(duration, 0.5);
  if (bounds.length < 2) return [];

  const beatChords: BeatChord[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const t0 = bounds[i];
    const t1 = bounds[i + 1];
    if (t1 - t0 < 0.05) continue;
    const chroma = chromaInWindow(cg, t0, t1);
    const { tmpl, score } = bestTemplate(chroma);
    beatChords.push({ rootPc: tmpl.rootPc, quality: tmpl.quality, score, t0, t1 });
  }

  smooth(beatChords);

  // Merge consecutive identical chords into segments.
  const speller = buildSpeller(key);
  const segs: ChordSegment[] = [];
  for (const bc of beatChords) {
    const last = segs[segs.length - 1];
    if (last && last.rootPc === bc.rootPc && last.quality === bc.quality) {
      last.endTime = bc.t1;
      last.confidence = (last.confidence + clampPct(bc.score)) / 2;
    } else {
      segs.push({
        startTime: bc.t0,
        endTime: bc.t1,
        rootPc: bc.rootPc,
        quality: bc.quality,
        label: speller(bc.rootPc) + SUFFIX[bc.quality],
        pcs: chordPitchClasses(bc.rootPc, bc.quality),
        confidence: clampPct(bc.score),
      });
    }
  }
  return segs.map((s) => ({ ...s, confidence: Math.round(s.confidence) }));
}

function fixedGrid(duration: number, step: number): number[] {
  const b: number[] = [];
  for (let t = 0; t < duration; t += step) b.push(t);
  b.push(duration);
  return b;
}

// Majority smoothing: if a beat disagrees with both equal neighbours, adopt them.
function smooth(bc: BeatChord[]): void {
  const same = (a: BeatChord, b: BeatChord) =>
    a.rootPc === b.rootPc && a.quality === b.quality;
  const orig = bc.map((b) => ({ ...b }));
  for (let i = 1; i < bc.length - 1; i++) {
    if (same(orig[i - 1], orig[i + 1]) && !same(orig[i], orig[i - 1])) {
      bc[i].rootPc = orig[i - 1].rootPc;
      bc[i].quality = orig[i - 1].quality;
    }
  }
}

// Cosine similarity (~0.4..1.0 in practice) → friendlier 0..100 scale.
function clampPct(score: number): number {
  return Math.max(0, Math.min(100, (score - 0.3) * (100 / 0.7)));
}
