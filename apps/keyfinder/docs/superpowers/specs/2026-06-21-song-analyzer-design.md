# Song Analyzer — design

A new section, **Analyze a song**, appended below the *Detect a key* section of the
keyfinder app. Upload an audio file → it detects **key**, **BPM**, and a **chord
timeline**, and shows **how to play it** via per-chord piano voicing diagrams.

## Decisions

- **Engine:** custom client-side DSP (Web Audio + hand-written FFT). No backend,
  no upload of the user's audio anywhere, no heavy WASM dependency. Matches the
  app's existing hand-built theory engine and OP-1 aesthetic.
- **Output:** chord timeline with a moving playhead + piano voicing diagrams.
- **Chord vocabulary:** major + minor triads + dominant 7ths.
- **Diagrams:** piano only.

## Data flow

1. User drops/picks an audio file (whatever `decodeAudioData` supports).
2. Decode on main thread → `OfflineAudioContext` renders a **mono** mixdown
   resampled to **22050 Hz** → `Float32Array`.
3. Transfer the samples to a **Web Worker** (UI never blocks); worker posts
   progress %.
4. Worker runs the pipeline → `{ key, bpm, beats[], chords[], duration }`.
5. UI renders results; user can **play the file back** with a playhead synced to
   the timeline, tap chords to hear/inspect them, or **load the key in the
   explorer** above.

If the worker can't be created, fall back to running the pipeline on the main
thread.

## DSP pipeline — `lib/audio/`

- `fft.ts` — iterative radix-2 Cooley–Tukey FFT (no deps) + real-signal magnitude
  spectrum helper.
- `chroma.ts` — Hann-windowed STFT → log-frequency bin→pitch-class mapping →
  per-frame 12-bin **chromagram**, plus `averageChroma`.
- `tempo.ts` — **spectral-flux** onset envelope → autocorrelation over 60–180 BPM
  → tempo; phase-aligned **beat grid** (beat timestamps).
- `chords.ts` — average chroma **per beat** → cosine-similarity match against
  unit-norm templates (12 maj + 12 min + 12 dom7) → **median-smooth** the
  sequence → merge into timed segments with confidence.
- `analyze.ts` — orchestrates the above, reporting progress; returns the result.

Key detection reuses `detectKey` from `lib/theory.ts` (Krumhansl–Schmuckler,
Pearson correlation) fed the whole-song averaged chroma vector.

## `lib/theory.ts` changes

- **Fix:** export `TONICS: Record<Mode, string[]>` (currently imported/used but
  undefined — the app does not compile without it).
- Add `spellChordRoot(pc, keyInfo)` for nice enharmonic chord labels in key
  context, and `chordPitchClasses(rootPc, quality)` for the piano diagrams.

## UI — `app/components/SongAnalyzer.tsx`

- Dropzone / file picker with drag-over state.
- Indeterminate→percentage progress while decoding + analyzing.
- **Readout:** detected key, BPM, confidence bar (hero type language).
- **Chord timeline:** horizontal blocks sized by duration; sweeping playhead;
  click a block to seek + inspect.
- **How to play it:** selected chord → mini one-octave piano with highlighted
  keys + click-to-hear (reuses existing `playChord`).
- **Load key in explorer** button (reuses existing `useMatch` behavior).

Styled in `app/globals.css` to match the existing OP-1 visual language.

## Error handling

- Unsupported/corrupt file → friendly inline message, no crash.
- Long files capped to first ~3 minutes (with a note).
- Worker-unavailable → main-thread fallback.

## Testing

- Pure DSP functions unit-tested with synthetic signals: a generated C-major
  chord classifies as C major / C chord; a 120 BPM click track reads ≈120 BPM.

## Honest expectations

Custom in-browser DSP detects **key and BPM reliably**; **chord recognition is
good on clear harmonic material** (pop/piano/guitar) and approximate on dense
mixes. Confidence is always shown.
