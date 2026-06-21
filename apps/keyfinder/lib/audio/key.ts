// Key detection for a whole-song chroma vector, using the classic
// Krumhansl–Schmuckler tonal-hierarchy profiles. We restrict to the 24
// major/minor keys (a song has one key, not a mode) and rank by Pearson
// correlation between the observed chroma and each rotated profile.

import { tonicName } from "../theory";

const KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

export interface DetectedKey {
  rootPc: number;
  mode: "major" | "minor";
  label: string; // "E♭ Minor"
  score: number; // Pearson r, -1..1
  confidence: number; // 0..100, gap between best and runner-up
}

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) {
    ma += a[i];
    mb += b[i];
  }
  ma /= n;
  mb /= n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - ma;
    const xb = b[i] - mb;
    num += xa * xb;
    da += xa * xa;
    db += xb * xb;
  }
  if (da === 0 || db === 0) return 0;
  return num / Math.sqrt(da * db);
}

/** Rank all 24 major/minor keys for a 12-length chroma vector, best first. */
export function rankKeys(chroma: number[]): DetectedKey[] {
  const out: Omit<DetectedKey, "confidence">[] = [];
  for (let root = 0; root < 12; root++) {
    for (const mode of ["major", "minor"] as const) {
      const profile = mode === "major" ? KK_MAJOR : KK_MINOR;
      const rotated = chroma.map((_, i) => profile[(i - root + 12) % 12]);
      out.push({
        rootPc: root,
        mode,
        label: `${tonicName(root, mode)} ${mode === "major" ? "Major" : "Minor"}`,
        score: pearson(chroma, rotated),
      });
    }
  }
  out.sort((a, b) => b.score - a.score);

  const best = out[0].score;
  const second = out[1]?.score ?? 0;
  // Confidence: how decisively #1 beats #2, mapped to a friendly 0..100.
  const gap = Math.max(0, best - second);
  const confidence = Math.round(Math.min(100, 40 + gap * 350));
  return out.map((k, i) => ({ ...k, confidence: i === 0 ? confidence : 0 }));
}

/** Best single key for a chroma vector. */
export function detectKeyFromChroma(chroma: number[]): DetectedKey {
  return rankKeys(chroma)[0];
}
