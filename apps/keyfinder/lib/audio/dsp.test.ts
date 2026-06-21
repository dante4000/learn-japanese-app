import { describe, it, expect } from "vitest";
import { fft } from "./fft";
import { computeChromagram, averageChroma } from "./chroma";
import { detectKeyFromChroma } from "./key";
import { classifyChord, chordPitchClasses } from "./chords";
import { detectTempo } from "./tempo";

// Build a sine tone buffer at the given frequency.
function tone(freq: number, seconds: number, sampleRate: number): Float32Array {
  const n = Math.floor(seconds * sampleRate);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
  return out;
}

// Sum several sine tones (a chord).
function chord(freqs: number[], seconds: number, sampleRate: number): Float32Array {
  const buf = tone(freqs[0], seconds, sampleRate);
  for (let f = 1; f < freqs.length; f++) {
    const t = tone(freqs[f], seconds, sampleRate);
    for (let i = 0; i < buf.length; i++) buf[i] += t[i];
  }
  return buf;
}

describe("fft", () => {
  it("puts a pure cosine's energy in the matching bin", () => {
    const N = 64;
    const k = 5;
    const re = new Float32Array(N);
    const im = new Float32Array(N);
    for (let i = 0; i < N; i++) re[i] = Math.cos((2 * Math.PI * k * i) / N);
    fft(re, im);
    const mags = Array.from({ length: N / 2 }, (_, i) => Math.hypot(re[i], im[i]));
    const peak = mags.indexOf(Math.max(...mags));
    expect(peak).toBe(k);
  });
});

describe("chromagram", () => {
  it("maps an A440 tone to pitch class A (9)", () => {
    const sr = 22050;
    const cg = computeChromagram(tone(440, 2, sr), sr);
    const avg = averageChroma(cg.frames);
    const top = avg.indexOf(Math.max(...avg));
    expect(top).toBe(9);
  });
});

describe("key detection", () => {
  it("identifies C major from a C-major scale chroma", () => {
    // C major scale presence vector.
    const chroma = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1];
    const key = detectKeyFromChroma(chroma);
    expect(key.rootPc).toBe(0);
    expect(key.mode).toBe("major");
  });

  it("identifies A minor leaning when the sixth degree is emphasised", () => {
    // Same notes but weight A and E (minor tonic/fifth) heavily.
    const chroma = [0.5, 0, 1, 0, 1, 0.5, 0, 0.5, 0, 2, 0, 1];
    const key = detectKeyFromChroma(chroma);
    expect(key.mode).toBe("minor");
    expect(key.rootPc).toBe(9);
  });
});

describe("chord classification", () => {
  const C = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0]; // C E G
  const Cm = [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0]; // C E♭ G
  const C7 = [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]; // C E G B♭

  it("recognises a major triad", () => {
    const r = classifyChord(C);
    expect(r.rootPc).toBe(0);
    expect(r.quality).toBe("maj");
  });

  it("recognises a minor triad", () => {
    const r = classifyChord(Cm);
    expect(r.rootPc).toBe(0);
    expect(r.quality).toBe("min");
  });

  it("recognises a dominant 7th", () => {
    const r = classifyChord(C7);
    expect(r.rootPc).toBe(0);
    expect(r.quality).toBe("7");
  });

  it("derives the right pitch classes for a voicing", () => {
    expect(chordPitchClasses(7, "maj")).toEqual([7, 11, 2]); // G B D
    expect(chordPitchClasses(9, "min")).toEqual([9, 0, 4]); // A C E
  });
});

describe("tempo detection", () => {
  it("reads ~120 BPM from a half-second click track", () => {
    const sr = 22050;
    const seconds = 10;
    const buf = new Float32Array(seconds * sr);
    const period = 0.5 * sr; // 120 BPM
    for (let pos = 0; pos < buf.length; pos += period) {
      // short percussive click
      for (let i = 0; i < 200 && pos + i < buf.length; i++) {
        buf[Math.floor(pos) + i] = Math.exp(-i / 40) * (i % 2 ? 1 : -1);
      }
    }
    const { bpm } = detectTempo(buf, sr);
    expect(Math.abs(bpm - 120)).toBeLessThanOrEqual(4);
  });
});
