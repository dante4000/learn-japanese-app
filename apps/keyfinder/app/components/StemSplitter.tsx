"use client";

import { useCallback, useRef, useState } from "react";
import {
  checkTask,
  startSplit,
  uploadFile,
  type StemTrack,
} from "@/lib/stems/client";
import StemMixer from "./StemMixer";

const STEM_OPTIONS: { id: string; label: string; icon: string }[] = [
  { id: "vocals", label: "Vocals", icon: "🎤" },
  { id: "drums", label: "Drums", icon: "🥁" },
  { id: "bass", label: "Bass", icon: "🎸" },
  { id: "piano", label: "Piano", icon: "🎹" },
  { id: "electric_guitar", label: "Elec. guitar", icon: "🎸" },
  { id: "acoustic_guitar", label: "Ac. guitar", icon: "🎻" },
];

type Phase = "idle" | "working" | "done" | "error";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function StemSplitter() {
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
  const cancelled = useRef(false);

  const togglePick = useCallback((id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const pickFile = useCallback((f: File) => {
    setFile(f);
    setFileName(f.name);
    setError(null);
  }, []);

  const run = useCallback(async () => {
    if (!file || picked.size === 0) return;
    cancelled.current = false;
    setPhase("working");
    setError(null);
    setTracks([]);
    const stems = STEM_OPTIONS.filter((s) => picked.has(s.id)).map((s) => s.id);
    try {
      setStage("Uploading");
      setProgress(0.08);
      const up = await uploadFile(file);

      const minutesNeeded = (up.duration / 60) * stems.length;
      if (up.minutesLeft < minutesNeeded) {
        throw new Error(
          `Not enough LALAL minutes left (${up.minutesLeft.toFixed(
            1,
          )} left, ~${minutesNeeded.toFixed(1)} needed).`,
        );
      }

      setStage("Separating");
      setProgress(0.15);
      const taskId = await startSplit(up.id, stems);

      // poll (LALAL /check limit is 30/min → ~2.5s is safe)
      for (;;) {
        if (cancelled.current) return;
        await sleep(2500);
        const res = await checkTask(taskId);
        if (res.status === "progress") {
          setProgress(0.15 + (res.progress / 100) * 0.8);
          setStage(res.progress === 0 ? "Queued" : "Separating");
        } else if (res.status === "success") {
          setProgress(1);
          setTracks(res.tracks);
          setPhase("done");
          return;
        } else if (res.status === "error") {
          throw new Error(res.error);
        } else if (res.status === "cancelled") {
          throw new Error("The split was cancelled.");
        }
      }
    } catch (e) {
      if (cancelled.current) return;
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("error");
    }
  }, [file, picked]);

  const reset = useCallback(() => {
    cancelled.current = true;
    setPhase("idle");
    setFile(null);
    setFileName("");
    setTracks([]);
    setError(null);
    setProgress(0);
  }, []);

  const lanes = tracks.map((t) => ({
    spec: { id: t.label, label: t.name, url: t.url },
    rawLabel: t.label,
  }));

  return (
    <section className="analyzer splitter">
      <div className="detect-head">
        <span className="detect-title mono">Split into stems</span>
        <span className="detect-sub mono">
          isolate vocals, drums, bass &amp; more — powered by LALAL.AI
        </span>
        {(phase === "done" || phase === "error") && (
          <button className="clear" onClick={reset}>
            new file
          </button>
        )}
      </div>

      {(phase === "idle" || phase === "error") && (
        <>
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
              MP3 · WAV · M4A · FLAC — separated in the cloud
            </span>
          </label>

          <div className="stem-pick">
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

          <button
            className="split-go"
            disabled={!file || picked.size === 0}
            onClick={run}
          >
            {picked.size === 0
              ? "pick at least one stem"
              : `split ${picked.size} stem${picked.size > 1 ? "s" : ""} →`}
          </button>

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

      {phase === "done" && tracks.length > 0 && <StemMixer stems={lanes} />}
    </section>
  );
}
