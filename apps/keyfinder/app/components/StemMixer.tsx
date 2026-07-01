"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStemMixer, type StemSpec } from "@/lib/audio/useStemMixer";
import { computePeaks, drawWaveform } from "@/lib/audio/waveform";
import { downloadUrl } from "@/lib/stems/client";

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Per-stem accent colors (waveform tint).
const COLORS: Record<string, string> = {
  vocals: "#2b5dd6",
  drum: "#c2571f",
  bass: "#7a3fb0",
  piano: "#1f8a5b",
  electric_guitar: "#c23b6a",
  acoustic_guitar: "#a67c1f",
};
const BACKING_COLOR = "#6a665b";

function laneColor(rawLabel: string): string {
  if (rawLabel.startsWith("no_")) return BACKING_COLOR;
  return COLORS[rawLabel] ?? "#2b5dd6";
}

interface Lane {
  spec: StemSpec;
  rawLabel: string;
}

function WaveLane({
  id,
  color,
  progress,
  getBuffer,
  onSeek,
}: {
  id: string;
  color: string;
  progress: number;
  getBuffer: (id: string) => AudioBuffer | null;
  onSeek: (fraction: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peaksRef = useRef<Float32Array | null>(null);
  const widthRef = useRef(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    if (w === 0) return;
    const buf = getBuffer(id);
    if (!buf) return;
    if (!peaksRef.current || widthRef.current !== w) {
      peaksRef.current = computePeaks(buf, w);
      widthRef.current = w;
    }
    drawWaveform(canvas, peaksRef.current, `${color}55`, progress, color);
  }, [id, color, progress, getBuffer]);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    const onResize = () => {
      peaksRef.current = null;
      render();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className="wave"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onSeek((e.clientX - rect.left) / rect.width);
      }}
    />
  );
}

export default function StemMixer({ stems }: { stems: Lane[] }) {
  const specs = useMemo(() => stems.map((l) => l.spec), [stems]);
  const rawLabels = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of stems) m.set(l.spec.id, l.rawLabel);
    return m;
  }, [stems]);

  const mix = useStemMixer(specs);
  const {
    status,
    duration,
    position,
    isPlaying,
    tracks,
    masterVolume,
    play,
    pause,
    seek,
    setVolume,
    toggleMute,
    toggleSolo,
    setMasterVolume,
    getBuffer,
  } = mix;

  const progress = duration > 0 ? position / duration : 0;

  if (status === "loading") {
    return <p className="an-stage mono">loading stems…</p>;
  }
  if (status === "error") {
    return <p className="dz-error mono">Couldn&apos;t load the separated stems.</p>;
  }

  return (
    <div className="mixer">
      <div className="transport">
        <button className="tp-btn" onClick={() => (isPlaying ? pause() : play())}>
          {isPlaying ? "❚❚ pause" : "▶ play"}
        </button>
        <span className="tp-time mono">
          {fmt(position)} / {fmt(duration)}
        </span>
        <label className="master-vol mono">
          master
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
          />
        </label>
      </div>

      <div className="lanes">
        {tracks.map((t) => {
          const raw = rawLabels.get(t.id) ?? "";
          const color = laneColor(raw);
          const proxy = specs.find((s) => s.id === t.id)?.url ?? "";
          return (
            <div key={t.id} className={`lane ${t.failed ? "failed" : ""}`}>
              <div className="lane-head">
                <span className="lane-name" style={{ color }}>
                  {t.label}
                </span>
                <div className="lane-ctl">
                  <button
                    className={`sm-btn ${t.muted ? "on" : ""}`}
                    onClick={() => toggleMute(t.id)}
                    title="Mute"
                  >
                    M
                  </button>
                  <button
                    className={`sm-btn solo ${t.soloed ? "on" : ""}`}
                    onClick={() => toggleSolo(t.id)}
                    title="Solo"
                  >
                    S
                  </button>
                  <input
                    className="lane-vol"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={t.volume}
                    onChange={(e) => setVolume(t.id, parseFloat(e.target.value))}
                    title="Volume"
                  />
                  <a
                    className="lane-dl"
                    href={downloadUrl(proxy, `${t.label}.wav`)}
                    title="Download stem"
                  >
                    ↓
                  </a>
                </div>
              </div>
              {t.failed ? (
                <p className="dz-error mono">failed to load</p>
              ) : (
                <WaveLane
                  id={t.id}
                  color={color}
                  progress={progress}
                  getBuffer={getBuffer}
                  onSeek={(f) => seek(f * duration)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
