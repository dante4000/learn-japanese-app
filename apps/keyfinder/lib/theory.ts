// Music theory engine: correct enharmonic note spelling for any key.

export type Mode =
  | "major"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "minor"
  | "locrian";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export interface ModeDef {
  id: Mode;
  name: string; // "Mixolydian"
  short: string; // "Mix"
  intervals: number[]; // semitones from tonic
  degree: number; // which degree of the parent major scale (0–6)
}

// The seven diatonic modes, ordered brightest → darkest.
export const MODES: ModeDef[] = [
  { id: "lydian", name: "Lydian", short: "Lyd", intervals: [0, 2, 4, 6, 7, 9, 11], degree: 3 },
  { id: "major", name: "Major", short: "Maj", intervals: [0, 2, 4, 5, 7, 9, 11], degree: 0 },
  { id: "mixolydian", name: "Mixolydian", short: "Mix", intervals: [0, 2, 4, 5, 7, 9, 10], degree: 4 },
  { id: "dorian", name: "Dorian", short: "Dor", intervals: [0, 2, 3, 5, 7, 9, 10], degree: 1 },
  { id: "minor", name: "Minor", short: "Min", intervals: [0, 2, 3, 5, 7, 8, 10], degree: 5 },
  { id: "phrygian", name: "Phrygian", short: "Phr", intervals: [0, 1, 3, 5, 7, 8, 10], degree: 2 },
  { id: "locrian", name: "Locrian", short: "Loc", intervals: [0, 1, 3, 5, 6, 8, 10], degree: 6 },
];

const MODE_MAP: Record<Mode, ModeDef> = Object.fromEntries(
  MODES.map((m) => [m.id, m]),
) as Record<Mode, ModeDef>;

const INTERVALS: Record<Mode, number[]> = Object.fromEntries(
  MODES.map((m) => [m.id, m.intervals]),
) as Record<Mode, number[]>;

// Default chromatic tonic spelling (favour the common reading per pitch-class).
const PREF_TONIC = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];

// Major/minor keep their classic spellings so we never land on awkward tonics
// (e.g. B# major or A♭ minor); other modes use the default reading.
const TONIC_OVERRIDE: Partial<Record<Mode, string[]>> = {
  //        0     1     2     3     4    5     6     7     8     9    10    11
  major: ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"],
  minor: ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"],
};

export function tonicName(pc: number, mode: Mode): string {
  return (TONIC_OVERRIDE[mode] ?? PREF_TONIC)[pc];
}

// Per-mode tonic spelling table: TONICS[mode][pc] -> spelled tonic name.
export const TONICS: Record<Mode, string[]> = Object.fromEntries(
  MODES.map((m) => [m.id, TONIC_OVERRIDE[m.id] ?? PREF_TONIC]),
) as Record<Mode, string[]>;

const ACC_SYMBOL: Record<number, string> = {
  [-2]: "𝄫",
  [-1]: "♭",
  [0]: "",
  [1]: "♯",
  [2]: "𝄪",
};

function parseNote(name: string): { letter: string; pc: number } {
  const letter = name[0];
  let acc = 0;
  for (const ch of name.slice(1)) {
    if (ch === "♯" || ch === "#") acc += 1;
    else if (ch === "♭" || ch === "b") acc -= 1;
  }
  return { letter, pc: (LETTER_PC[letter] + acc + 1200) % 12 };
}

export interface ScaleNote {
  name: string; // spelled name, e.g. "F♯"
  pc: number; // 0-11 pitch class
  degree: number; // 1-7
}

export interface Chord {
  name: string; // e.g. "Dm", "G", "B°"
  roman: string; // e.g. "ii", "V", "vii°"
  root: string;
  quality: "maj" | "min" | "dim" | "aug";
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

function buildScale(tonic: string, mode: Mode): ScaleNote[] {
  const { letter, pc: rootPc } = parseNote(tonic);
  const rootLetterIdx = LETTERS.indexOf(letter as (typeof LETTERS)[number]);
  return INTERVALS[mode].map((interval, i) => {
    const noteLetter = LETTERS[(rootLetterIdx + i) % 7];
    const naturalPc = LETTER_PC[noteLetter];
    const targetPc = (rootPc + interval) % 12;
    let diff = targetPc - naturalPc;
    while (diff > 6) diff -= 12;
    while (diff < -6) diff += 12;
    return {
      name: noteLetter + (ACC_SYMBOL[diff] ?? ""),
      pc: targetPc,
      degree: i + 1,
    };
  });
}

function diatonicChords(scale: ScaleNote[]): Chord[] {
  return scale.map((note, i) => {
    const third = scale[(i + 2) % 7];
    const fifth = scale[(i + 4) % 7];
    const t = (third.pc - note.pc + 12) % 12;
    const f = (fifth.pc - note.pc + 12) % 12;

    let quality: Chord["quality"];
    let suffix: string;
    let roman = ROMAN[i];
    if (t === 4 && f === 7) {
      quality = "maj";
      suffix = "";
    } else if (t === 3 && f === 7) {
      quality = "min";
      suffix = "m";
      roman = roman.toLowerCase();
    } else if (t === 3 && f === 6) {
      quality = "dim";
      suffix = "°";
      roman = roman.toLowerCase() + "°";
    } else {
      quality = "aug";
      suffix = "+";
      roman = roman + "+";
    }
    return { name: note.name + suffix, roman, root: note.name, quality };
  });
}

export interface KeyInfo {
  tonic: string;
  mode: Mode;
  label: string; // "C Major"
  scale: ScaleNote[];
  pcs: Set<number>;
  rootPc: number;
  chords: Chord[];
  signature: { count: number; type: "sharp" | "flat" | "natural" };
}

export function getKey(rootPc: number, mode: Mode): KeyInfo {
  const tonic = tonicName(rootPc, mode);
  const scale = buildScale(tonic, mode);
  const chords = diatonicChords(scale);

  let sharps = 0;
  let flats = 0;
  for (const n of scale) {
    if (n.name.includes("♯")) sharps += n.name.split("♯").length - 1;
    if (n.name.includes("♭")) flats += n.name.split("♭").length - 1;
  }
  const signature: KeyInfo["signature"] =
    sharps === 0 && flats === 0
      ? { count: 0, type: "natural" }
      : sharps >= flats
        ? { count: sharps, type: "sharp" }
        : { count: flats, type: "flat" };

  return {
    tonic,
    mode,
    label: `${tonic} ${MODE_MAP[mode].name}`,
    scale,
    pcs: new Set(scale.map((n) => n.pc)),
    rootPc,
    chords,
    signature,
  };
}

// Equal-tempered frequency for a pitch class at a given octave (A4 = 440).
export function pcToFreq(pc: number, octave: number): number {
  const midi = pc + 12 * (octave + 1);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ---- Key detection (Krumhansl–Schmuckler) ----
// Chromatic labels for the note picker (sharps, with common flat spellings).
export const CHROMATIC = [
  "C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B",
] as const;

// Per-mode tonal template (weights relative to the tonic). In-scale degrees
// score positively — the tonic, fifth and third most of all — while every
// note OUTSIDE the scale is strongly penalised. This is what makes a key that
// contains all the picked notes always outrank one that's missing a note.
const OUT_OF_SCALE = -3;
function buildTemplate(intervals: number[]): number[] {
  const t = new Array(12).fill(OUT_OF_SCALE);
  for (const iv of intervals) {
    let w = 1.5; // generic in-scale tone
    if (iv === 0) w = 3.2; // tonic
    else if (iv === 7) w = 2.2; // perfect fifth
    else if (iv === 3 || iv === 4) w = 2.2; // third (defines major/minor colour)
    t[iv] = w;
  }
  return t;
}

const TEMPLATES: Record<Mode, number[]> = Object.fromEntries(
  MODES.map((m) => [m.id, buildTemplate(m.intervals)]),
) as Record<Mode, number[]>;

export interface KeyMatch {
  rootPc: number;
  mode: Mode;
  tonic: string;
  label: string;
  score: number;
  confidence: number; // 0..100, relative to the field
  missing: number; // how many picked notes fall outside this key
}

// Given a 12-length pitch-class weight vector (1 = note present), rank every
// major/minor/modal key by how well it fits the picked notes, best first.
export function detectKey(input: number[]): KeyMatch[] {
  const picked: number[] = [];
  for (let pc = 0; pc < 12; pc++) if (input[pc] > 0) picked.push(pc);
  if (picked.length === 0) return [];

  const raw: Omit<KeyMatch, "confidence">[] = [];
  for (let root = 0; root < 12; root++) {
    for (const m of MODES) {
      const tmpl = TEMPLATES[m.id];
      let score = 0;
      let missing = 0;
      for (const pc of picked) {
        const w = tmpl[(pc - root + 12) % 12];
        score += input[pc] * w;
        if (w === OUT_OF_SCALE) missing += 1;
      }
      raw.push({
        rootPc: root,
        mode: m.id,
        tonic: tonicName(root, m.id),
        label: `${tonicName(root, m.id)} ${m.name}`,
        score,
        missing,
      });
    }
  }

  const isBasic = (m: Mode) => m === "major" || m === "minor";
  raw.sort((a, b) => {
    // 1. keys that contain ALL your notes come first
    if (a.missing !== b.missing) return a.missing - b.missing;
    // 2. prefer plain major/minor over the exotic modes
    const ba = isBasic(a.mode) ? 0 : 1;
    const bb = isBasic(b.mode) ? 0 : 1;
    if (ba !== bb) return ba - bb;
    // 3. break ties by tonal fit (tonic / fifth / third emphasis)
    return b.score - a.score;
  });

  // confidence: softmax spread so the gap between #1 and the rest is legible
  const top = raw[0].score;
  const exps = raw.map((r) => Math.exp((r.score - top) * 0.7));
  const sum = exps.reduce((s, x) => s + x, 0);
  return raw.map((r, i) => ({ ...r, confidence: Math.round((exps[i] / sum) * 100) }));
}
