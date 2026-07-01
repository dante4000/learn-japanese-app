"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkTasks,
  startSplit,
  uploadFile,
  type StemTrack,
} from "@/lib/stems/client";
import { decodeFileToMono } from "@/lib/audio/decode";
import { runAnalysis } from "@/lib/audio/run";
import type { AnalysisResult } from "@/lib/audio/analyze";
import type { Mode } from "@/lib/theory";
import StemMixer from "./StemMixer";

const PREVIEW_SECONDS = 20;

const STEM_OPTIONS: { id: string; label: string; icon: string }[] = [
  { id: "vocals", label: "Vocals", icon: "🎤" },
  { id: "drums", label: "Drums", icon: "🥁" },
  { id: "bass", label: "Bass", icon: "🎸" },
  { id: "piano", label: "Piano", icon: "🎹" },
  { id: "electric_guitar", label: "Elec. gtr", icon: "🎸" },
  { id: "acoustic_guitar", label: "Ac. gtr", icon: "🎻" },
  { id: "synthesizer", label: "Synth", icon: "🎛️" },
  { id: "strings", label: "Strings", icon: "🎻" },
  { id: "wind", label: "Wind", icon: "🎺" },
];

type Phase = "idle" | "working" | "preview" | "done" | "error";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Run the existing client-side DSP (key / BPM / chords) on the full uploaded
// file. Best-effort: separation shouldn't fail if analysis does.
async function analyzeFile(file: File): Promise<AnalysisResult | null> {
  try {
    const decoded = await decodeFileToMono(file);
    return await runAnalysis(decoded.samples, decoded.sampleRate, () => {});
  } catch {
    return null;
  }
}

interface Props {
  onUseKey?: (rootPc: number, mode: Mode) => void;
}

export default function StemSplitter({ onUseKey }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [picked, setPicked] = useState<Set<string>>(
    new Set(["vocals", "drums", "bass"]),
  );
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<StemTrack[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  const [fileDuration, setFileDuration] = useState<number | null>(null);
  const runId = useRef(0);
  const fileToken = useRef(0);

  const togglePick = useCallback((id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const pickFile = useCallback((f: File) => {
    const tok = ++fileToken.current;
    setFile(f);
    setFileName(f.name);
    setError(null);
    setAnalysis(null);
    setFileDuration(null);

    // Probe the true duration (cheap, metadata-only) for an accurate cost estimate.
    const url = URL.createObjectURL(f);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      if (fileToken.current === tok && isFinite(audio.duration)) {
        setFileDuration(audio.duration);
      }
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => URL.revokeObjectURL(url);
    audio.src = url;

    // Kick off the free client-side key/BPM/chord analysis once per file.
    void analyzeFile(f).then((a) => {
      if (fileToken.current === tok && a) setAnalysis(a);
    });
  }, []);

  // mode: "preview" splits a cheap ~20s clip; "full" splits the whole song.
  const run = useCallback(
    async (mode: "preview" | "full", stemList: string[]) => {
      if (!file || stemList.length === 0) return;
      const id = ++runId.current;
      setPhase("working");
      setError(null);
      setTracks([]);
      setStage(mode === "preview" ? "Trimming preview" : "Uploading");
      setProgress(0.05);

      try {
        const up = await uploadFile(
          file,
          mode === "preview" ? PREVIEW_SECONDS : undefined,
        );
        if (runId.current !== id) return;
        setMinutesLeft(up.minutesLeft);

        // Only enforce the balance when we could actually read it; otherwise
        // let LALAL reject the split itself. (minutesLeft is null on API error.)
        const needed = (up.duration / 60) * stemList.length;
        if (up.minutesLeft != null && up.minutesLeft < needed) {
          throw new Error(
            `Not enough LALAL minutes (${up.minutesLeft.toFixed(1)} left, ~${needed.toFixed(1)} needed).`,
          );
        }

        setStage("Separating");
        setProgress(0.15);
        const taskIds = await startSplit(up.id, stemList);

        // Bound the poll so a dropped/expired task can't spin forever.
        const deadline = Date.now() + 6 * 60 * 1000;
        for (;;) {
          if (runId.current !== id) return;
          await sleep(2500);
          if (runId.current !== id) return;
          if (Date.now() > deadline) {
            throw new Error("Timed out waiting for the split. Please try again.");
          }
          const res = await checkTasks(taskIds);
          if (runId.current !== id) return;
          if (res.status === "progress") {
            setProgress(0.15 + (res.progress / 100) * 0.8);
            setStage(res.progress === 0 ? "Queued" : "Separating");
          } else if (res.status === "success") {
            setProgress(1);
            setTracks(res.tracks);
            setPhase(mode === "preview" ? "preview" : "done");
            return;
          } else if (res.status === "error") {
            throw new Error(res.error);
          } else if (res.status === "cancelled") {
            throw new Error("The split was cancelled.");
          } else {
            // "unknown" — tasks fell out of LALAL's response; don't loop forever.
            throw new Error("Lost track of the split — please try again.");
          }
        }
      } catch (e) {
        if (runId.current !== id) return;
        setError(e instanceof Error ? e.message : "Something went wrong.");
        setPhase("error");
      }
    },
    [file],
  );

  const reset = useCallback(() => {
    runId.current++;
    fileToken.current++;
    setPhase("idle");
    setFile(null);
    setFileName("");
    setTracks([]);
    setAnalysis(null);
    setFileDuration(null);
    setError(null);
    setProgress(0);
  }, []);

  // Cancel any in-flight run/analysis if the component unmounts.
  useEffect(() => {
    return () => {
      runId.current++;
      fileToken.current++;
    };
  }, []);

  // Prefer the true file duration; fall back to the (3-min-capped) analysis.
  const estDuration = fileDuration ?? analysis?.duration ?? null;
  const fullCost =
    estDuration && picked.size ? (estDuration / 60) * picked.size : null;

  const lanes = tracks.map((t) => ({
    spec: { id: t.label, label: t.name, url: t.url },
    rawLabel: t.label,
  }));

  const showPicker = phase === "idle" || phase === "error" || phase === "preview";

  return (
    <section className="analyzer splitter">
      <div className="detect-head">
        <span className="detect-title mono">Split into stems</span>
        <span className="detect-sub mono">
          isolate any instrument — powered by LALAL.AI
        </span>
        {(phase === "done" || phase === "error" || phase === "preview") && (
          <button className="clear" onClick={reset}>
            new file
          </button>
        )}
      </div>

      {(phase === "idle" || phase === "error") && (
        <label
          className={`dropzone ${dragOver ? "over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) pickFile(f);
          }}
        >
          <input
            type="file"
            accept="audio/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickFile(f);
              e.target.value = "";
            }}
          />
          <span className="dz-icon" aria-hidden>
            ✂
          </span>
          <span className="dz-main">
            {fileName || "Drop an audio file or click to browse"}
          </span>
          <span className="dz-sub mono">
            MP3 · WAV · M4A · FLAC — preview is cheap, full split costs minutes
          </span>
        </label>
      )}

      {showPicker && (
        <>
          {phase === "preview" && (
            <p className="preview-banner mono">
              ◐ preview · first {PREVIEW_SECONDS}s — tweak stems, then get the full
              song
            </p>
          )}
          <div className="stem-pick">
            <button
              className="stem-chip preset"
              onClick={() => setPicked(new Set(["vocals"]))}
              title="Vocals + instrumental"
            >
              🎤 Vox / Inst
            </button>
            {STEM_OPTIONS.map((s) => (
              <button
                key={s.id}
                className={`stem-chip ${picked.has(s.id) ? "on" : ""}`}
                onClick={() => togglePick(s.id)}
              >
                <span aria-hidden>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>

          <div className="split-actions">
            <button
              className="split-go preview"
              disabled={!file || picked.size === 0}
              onClick={() => run("preview", [...picked])}
            >
              ◐ preview {PREVIEW_SECONDS}s
            </button>
            <button
              className="split-go"
              disabled={!file || picked.size === 0}
              onClick={() => run("full", [...picked])}
              title={fullCost ? `~${fullCost.toFixed(1)} min` : undefined}
            >
              {picked.size === 0
                ? "pick a stem"
                : `full split → ${picked.size} stem${picked.size > 1 ? "s" : ""}`}
              {fullCost ? ` · ~${fullCost.toFixed(1)}min` : ""}
            </button>
          </div>

          {minutesLeft != null && (
            <p className="an-stage mono">{minutesLeft.toFixed(1)} LALAL minutes left</p>
          )}

          {phase === "error" && error && (
            <p className="dz-error mono" role="alert">
              {error}
            </p>
          )}
        </>
      )}

      {phase === "working" && (
        <div className="analyzing">
          <div className="an-name mono">{fileName}</div>
          <div
            className="progress"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${Math.max(6, progress * 100)}%` }} />
          </div>
          <div className="an-stage mono">
            {stage} · {Math.round(progress * 100)}%
          </div>
        </div>
      )}

      {(phase === "preview" || phase === "done") && tracks.length > 0 && (
        <StemMixer stems={lanes} analysis={analysis} onUseKey={onUseKey} />
      )}
    </section>
  );
}
