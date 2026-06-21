// Orchestrates the full song-analysis pipeline over mono PCM samples and
// reports progress. Pure (no DOM / Web Audio) so it runs in a Web Worker or,
// as a fallback, on the main thread.

import { computeChromagram, songChroma } from "./chroma";
import { detectKeyFromChroma, type DetectedKey } from "./key";
import { detectTempo } from "./tempo";
import { detectChords, type ChordSegment } from "./chords";

export interface AnalysisResult {
  key: DetectedKey;
  bpm: number;
  beats: number[];
  chords: ChordSegment[];
  duration: number;
}

export type ProgressFn = (progress: number, stage: string) => void;

export function analyzePcm(
  samples: Float32Array,
  sampleRate: number,
  onProgress?: ProgressFn,
): AnalysisResult {
  const duration = samples.length / sampleRate;

  onProgress?.(0.1, "Building chromagram");
  const cg = computeChromagram(samples, sampleRate);

  onProgress?.(0.5, "Finding the key");
  const key = detectKeyFromChroma(songChroma(cg));

  onProgress?.(0.6, "Tracking the beat");
  const tempo = detectTempo(samples, sampleRate);

  onProgress?.(0.8, "Reading the chords");
  const chords = detectChords(cg, tempo.beats, key, duration);

  onProgress?.(1, "Done");
  return { key, bpm: tempo.bpm, beats: tempo.beats, chords, duration };
}
