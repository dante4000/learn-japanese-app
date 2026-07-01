# Stem Splitter — Design Spec

Date: 2026-06-30
App: `apps/keyfinder` (Next 16, React 19, currently 100% client-side, zero runtime deps)

## Goal

Add a **stem splitter** that separates an uploaded song into individual stems
(vocals, drums, bass, piano, electric guitar, acoustic guitar) plus a backing
track, and plays them back in an in-browser **synced multitrack mixer** with
mute / solo / volume per stem and per-stem downloads.

## Key decisions (locked)

- **Compute:** server-side via **LALAL.AI REST API v1**. Keyfinder deploys on
  Vercel (no GPU), so Vercel route handlers act as thin proxies to LALAL.
- **License key** lives in server env `LALAL_LICENSE`; never sent to the browser.
- **Stem selection:** user picks a subset per song.
- **Output:** in-browser synced mixer (mute/solo/volume, shared transport,
  canvas waveforms) + per-stem downloads.
- **Placement:** new standalone `<section>` below `SongAnalyzer` on the single page.
- **Splitter model:** `auto` (LALAL picks the current best per stem).
- **Use `multistem`, not per-stem calls:** multistem returns a true *partition*
  (chosen stems + one "backing" track that sums back to the original), which is
  what a mixer needs. Per-stem `stem_separator` calls overlap and can't
  reconstruct the song.

## LALAL.AI API v1 (authoritative facts)

Base: `https://www.lalal.ai/api/v1/`. Auth header: `X-License-Key: <key>`.

1. **Upload** — `POST /upload/`
   - Headers: `X-License-Key`, `Content-Disposition: attachment; filename="<name>"`,
     `Content-Type: application/octet-stream`. Body: **raw binary** (not multipart).
   - 200 → `{ id, name, size, duration, expires }` (`id` = source_id; `duration` seconds).

2. **Split (multistem)** — `POST /split/multistem/`
   - Body: `{ "source_id": "<id>", "presets": { "stem_list": [...], "splitter": "auto", "extraction_level": "deep_extraction" }, "idempotency_key": null }`
   - `stem_list` ⊆ `["vocals","drum","bass","piano","electric_guitar","acoustic_guitar"]`
     (note **`drum` is singular**). 200 → `{ "task_id": "<uuid>" }`. Billed per stem.

3. **Check** — `POST /check/`
   - Body: `{ "task_ids": ["<uuid>", ...] }`. Rate limit 30/min. Poll every ~3-5s.
   - 200 → `{ "result": { "<task_id>": <entry> } }` where entry `.status` is one of:
     - `progress` → `{ status, progress: 0-100 }` (`progress:0` = queued)
     - `success` → `{ status, result: { duration, tracks: [ {type, label, url}, ... ] } }`
       - multistem tracks: one `<stem>` per requested stem (type `stem`) + one
         `no_multistem` (type `back`) = the backing track.
     - `error` → `{ status, error: { detail, code } }` (e.g. `inference_error`)
     - `cancelled`, `server_error` (server_error has no source_id/presets)

4. **Minutes left** — `POST /limits/minutes_left/` (header only) → `{ minutes_left }` (float).

5. **Delete** (optional cleanup) — `POST /delete/` `{ source_id }` → `{}`.

Download URLs are on `d.lalal.ai` (no auth needed to GET). They 404 ~1h after a
`/delete/`; source auto-expires at upload `expires`.

### Gotchas
- No generic `/split/` in v1 — use `/split/multistem/`.
- Upload body is raw binary + required `Content-Disposition`.
- `drum` singular; synth/strings/wind unsupported by multistem → excluded from picker.
- `/check/` result is a map keyed by task_id; discriminate on `status`; handle
  `server_error` (missing fields) separately.
- `track.size` nullable.

## Server components (Vercel route handlers)

All under `app/api/stems/`. Each reads `process.env.LALAL_LICENSE`; if missing,
return 500 with a clear message. `export const runtime = "nodejs"`.

- `upload/route.ts` — `POST`. Receives the raw file body (or multipart w/ one
  file), forwards to LALAL `/upload/` with `Content-Disposition` from a
  `x-filename` header (or query). Returns `{ id, name, duration }`. Also fetch
  `minutes_left` and include it so the client can warn on low balance.
- `split/route.ts` — `POST` `{ source_id, stems: string[] }`. Maps UI stem ids to
  LALAL enum (`drums`→`drum`), calls `/split/multistem/`, returns `{ task_id }`.
- `check/route.ts` — `POST` `{ task_ids: string[] }`. Proxies `/check/`, returns a
  normalized shape: `{ status, progress, tracks?: [{label, type, url}], error? }`
  where each track `url` is rewritten to our own audio proxy (see below).
- `audio/route.ts` — `GET ?url=<d.lalal.ai url>&download=1`. Validates host is
  exactly `d.lalal.ai`, streams the response through (SSRF guard). Adds
  `Content-Disposition: attachment` when `download=1`. Enables same-origin
  `fetch`+`decodeAudioData` for the mixer and clean downloads.

## Client components

- `lib/stems/client.ts` — typed fetch wrappers: `uploadFile(file)`,
  `startSplit(sourceId, stems)`, `checkTasks(taskIds)`, plus `audioProxyUrl(url)`.
- `lib/audio/waveform.ts` — `computePeaks(buffer, width)` (min/max per column) and
  `drawWaveform(canvas, peaks, color, progress, playedColor)`. Zero deps.
- `lib/audio/useStemMixer.ts` — the synced mixer hook. One `AudioContext`, one
  master clock. Per stem: decoded `AudioBuffer` + `GainNode`. Play/pause/seek by
  recreating one-shot `AudioBufferSourceNode`s scheduled at a shared
  `ctx.currentTime + 0.05`. Position derived from the clock via rAF. Mute/solo/
  volume resolved to per-track gain (`muted ? 0 : anySolo ? (soloed?vol:0) : vol`),
  applied with `setTargetAtTime` to avoid clicks. iOS unlock via `resume()` inside
  the play gesture. Full teardown (`ctx.close()`) on unmount.
- `app/components/StemSplitter.tsx` — the section:
  1. **Idle:** dropzone (reuse analyzer dropzone styling) + stem picker
     (checkbox chips for the 6 stems, ≥1 required) + "split" button.
  2. **Working:** upload → split → poll progress bar + stage label.
  3. **Done:** mixer — one lane per stem + backing, each with waveform canvas,
     mute (M) / solo (S) toggles, volume slider, download button; a master
     transport (play/pause, time, seek by clicking any waveform) + master volume.

## Data flow

1. User drops file + picks stems → `POST /api/stems/upload` (file) → `{ id }`
   (+ `minutes_left`; warn if a stem count would exceed balance).
2. `POST /api/stems/split { source_id, stems }` → `{ task_id }`.
3. Poll `POST /api/stems/check { task_ids:[task_id] }` every ~3s until `success`.
4. For each returned track, load via `/api/stems/audio?url=…` → `decodeAudioData`
   → feed `useStemMixer`.
5. Downloads use `/api/stems/audio?url=…&download=1`.

## Error handling

- Missing `LALAL_LICENSE` → 500 "Stem splitting isn't configured."
- Low/zero minutes → friendly "Not enough LALAL minutes left (X)." before submit.
- LALAL task `error.code` (e.g. `inference_error`, duration/size limits) → readable
  per-song message; allow retry / new file.
- `/check` `server_error` / expired source → "This split expired, upload again."
- Audio proxy rejects any host ≠ `d.lalal.ai` with 400.
- Mixer: decode failure per stem → mark that lane errored, keep others playable.

## Testing

- `lib/stems/*.test.ts` — server helpers: UI→LALAL stem mapping, request body
  shape for `/split/multistem/`, and `/check` response normalization incl.
  progress/success/error/server_error branches (mock `fetch`).
- `lib/audio/waveform.test.ts` — `computePeaks` downsampling correctness
  (known buffer → expected min/max columns).
- Mixer hook: verified manually in-browser (Web Audio unavailable in vitest).

## Out of scope (v1, YAGNI)

- Synth / strings / wind stems (phoenix-only, don't partition).
- "Download custom mix" render (`OfflineAudioContext`), ZIP-all, VU meters, pan.
- Feeding a stem back into key detection (possible later; standalone for now).
- Persisting results / history.
