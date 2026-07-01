"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getKey, type Mode } from "@/lib/theory";
import { decodeFileToMono } from "@/lib/audio/decode";
import { runAnalysis } from "@/lib/audio/run";
import type { AnalysisResult } from "@/lib/audio/analyze";
import { type ChordSegment } from "@/lib/audio/chords";
import { fmtTime } from "@/lib/format";

// ---- mini one-octave keyboard geometry (for chord diagrams) ----
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
const BLACK = [
  { pc: 1, unit: 1 },
  { pc: 3, unit: 2 },
  { pc: 6, unit: 4 },
  { pc: 8, unit: 5 },
  { pc: 10, unit: 6 },
];
const MINI_UNIT = 100 / WHITE_PCS.length;

const CHROM_SHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const CHROM_FLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];

const DEGREE: Record<number, string> = {
  0: "R",
  3: "♭3",
  4: "3",
  7: "5",
  10: "♭7",
};

type Status = "idle" | "decoding" | "analyzing" | "done" | "error";

const fmt = fmtTime;

interface Props {
  onUseKey: (rootPc: number, mode: Mode) => void;
  playChord: (pcs: number[]) => void;
  playNote: (pc: number, octave: number) => void;
}

export default function SongAnalyzer({ onUseKey, playChord, playNote }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selected, setSelected] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const chordsRef = useRef<ChordSegment[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    chordsRef.current = result?.chords ?? [];
  }, [result]);

  const cleanupAudio = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.src = "";
    }
    audioRef.current = null;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  useEffect(() => cleanupAudio, [cleanupAudio]);

  const tick = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setCurrentTime(a.currentTime);
    const chords = chordsRef.current;
    const idx = chords.findIndex(
      (c) => a.currentTime >= c.startTime && a.currentTime < c.endTime,
    );
    if (idx >= 0) setSelected(idx);
    if (!a.paused) rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      cleanupAudio();
      setStatus("decoding");
      setStage("Decoding audio");
      setProgress(0);
      setError(null);
      setFileName(file.name);
      setResult(null);
      setSelected(-1);
      try {
        const decoded = await decodeFileToMono(file);
        setTruncated(decoded.truncated);
        setStatus("analyzing");
        setStage("Analyzing");
        const res = await runAnalysis(
          decoded.samples,
          decoded.sampleRate,
          (p, s) => {
            setProgress(p);
            setStage(s);
          },
        );
        const url = URL.createObjectURL(file);
        urlRef.current = url;
        const audio = new Audio(url);
        audio.addEventListener("ended", () => setIsPlaying(false));
        audioRef.current = audio;
        setResult(res);
        setSelected(res.chords.length ? 0 : -1);
        setStatus("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        setStatus("error");
      }
    },
    [cleanupAudio],
  );

  const reset = useCallback(() => {
    cleanupAudio();
    setStatus("idle");
    setResult(null);
    setError(null);
    setFileName("");
    setSelected(-1);
  }, [cleanupAudio]);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play();
      setIsPlaying(true);
      tick();
    } else {
      a.pause();
      setIsPlaying(false);
    }
  }, [tick]);

  const seekTo = useCallback(
    (time: number, idx: number) => {
      setSelected(idx);
      const a = audioRef.current;
      if (!a) return;
      a.currentTime = time;
      setCurrentTime(time);
      if (a.paused) {
        void a.play();
        setIsPlaying(true);
        tick();
      }
    },
    [tick],
  );

  // pc -> spelled note name in the detected key's context
  const noteName = useMemo(() => {
    if (!result) return (pc: number) => CHROM_SHARP[pc];
    const info = getKey(result.key.rootPc, result.key.mode);
    const m = new Map<number, string>();
    for (const n of info.scale) m.set(n.pc, n.name);
    const flats = info.signature.type === "flat";
    return (pc: number) => m.get(pc) ?? (flats ? CHROM_FLAT : CHROM_SHARP)[pc];
  }, [result]);

  const sel = result && selected >= 0 ? result.chords[selected] : null;
  const selPcs = useMemo(() => new Set(sel?.pcs ?? []), [sel]);
  const duration = result?.duration ?? 0;

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const busy = status === "decoding" || status === "analyzing";

  return (
    <section className="analyzer">
      <div className="detect-head">
        <span className="detect-title mono">Analyze a song</span>
        <span className="detect-sub mono">
          upload audio — key, BPM &amp; chords, all in your browser
        </span>
        {status === "done" && (
          <button className="clear" onClick={reset}>
            new file
          </button>
        )}
      </div>

      {(status === "idle" || status === "error") && (
        <>
          <label
            className={`dropzone ${dragOver ? "over" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept="audio/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
            <span className="dz-icon" aria-hidden>
              ♪
            </span>
            <span className="dz-main">Drop an audio file or click to browse</span>
            <span className="dz-sub mono">MP3 · WAV · M4A · OGG — never leaves your device</span>
          </label>
          {status === "error" && error && (
            <p className="dz-error mono" role="alert">
              {error}
            </p>
          )}
        </>
      )}

      {busy && (
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
            {stage}
            {status === "analyzing" ? ` · ${Math.round(progress * 100)}%` : "…"}
          </div>
        </div>
      )}

      {status === "done" && result && (
        <div className="song-result">
          <div className="readout">
            <button
              className="ro-key"
              onClick={() => onUseKey(result.key.rootPc, result.key.mode)}
              title="Load this key in the explorer above"
            >
              <span className="ro-label mono">key</span>
              <span className="ro-value">
                {result.key.label.replace(/ Major| Minor/, "")}
                <span className="ro-qual">
                  {result.key.mode === "major" ? "major" : "minor"}
                </span>
              </span>
              <span className="ro-conf mono">{result.key.confidence}% sure</span>
            </button>
            <div className="ro-bpm">
              <span className="ro-label mono">tempo</span>
              <span className="ro-value">
                {result.bpm || "—"}
                <span className="ro-qual">bpm</span>
              </span>
              <span className="ro-conf mono">{result.chords.length} chords</span>
            </div>
          </div>

          {truncated && (
            <p className="an-stage mono">analyzed first 3:00 of the track</p>
          )}

          {/* transport */}
          <div className="transport">
            <button className="tp-btn" onClick={togglePlay}>
              {isPlaying ? "❚❚ pause" : "▶ play"}
            </button>
            <span className="tp-time mono">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
            <button
              className="tp-use"
              onClick={() => onUseKey(result.key.rootPc, result.key.mode)}
            >
              load key ↑
            </button>
          </div>

          {/* chord timeline */}
          {result.chords.length > 0 ? (
            <div className="timeline-wrap">
              <div
                className="timeline"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const t = ((e.clientX - rect.left) / rect.width) * duration;
                  const idx = result.chords.findIndex(
                    (c) => t >= c.startTime && t < c.endTime,
                  );
                  seekTo(t, idx >= 0 ? idx : selected);
                }}
              >
                {result.chords.map((c, i) => {
                  const left = (c.startTime / duration) * 100;
                  const width = ((c.endTime - c.startTime) / duration) * 100;
                  return (
                    <button
                      key={i}
                      className={`tl-chord ${i === selected ? "on" : ""}`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        seekTo(c.startTime, i);
                      }}
                      title={`${c.label} · ${fmt(c.startTime)}`}
                    >
                      <span>{c.label}</span>
                    </button>
                  );
                })}
                <span
                  className="playhead"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                  aria-hidden
                />
              </div>
            </div>
          ) : (
            <p className="dz-error mono">
              Couldn&apos;t make out distinct chords — the mix may be too dense.
            </p>
          )}

          {/* how to play it: selected chord voicing */}
          {sel && (
            <div className="voicing">
              <div className="voicing-head">
                <span className="v-name">{sel.label}</span>
                <span className="v-notes mono">
                  {sel.pcs.map((pc) => noteName(pc)).join(" · ")}
                </span>
                <button className="v-play" onClick={() => playChord(sel.pcs)}>
                  ▶ hear it
                </button>
              </div>
              <div className="mini-kb">
                {WHITE_PCS.map((pc) => {
                  const on = selPcs.has(pc);
                  const root = pc === sel.rootPc;
                  return (
                    <div
                      key={`w${pc}`}
                      className={`mwkey ${root ? "root" : on ? "on" : ""}`}
                      onClick={() => playNote(pc, 4)}
                    >
                      {on && <span className="mlabel">{noteName(pc)}</span>}
                    </div>
                  );
                })}
                <div className="mbkeys">
                  {BLACK.map((b) => {
                    const on = selPcs.has(b.pc);
                    const root = b.pc === sel.rootPc;
                    return (
                      <div
                        key={`b${b.pc}`}
                        className={`mbkey ${root ? "root" : on ? "on" : ""}`}
                        style={{ left: `${b.unit * MINI_UNIT}%` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          playNote(b.pc, 4);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="v-degrees mono" aria-hidden>
                {sel.pcs.map((pc) => {
                  const iv = (pc - sel.rootPc + 12) % 12;
                  return <span key={pc}>{DEGREE[iv] ?? ""}</span>;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
