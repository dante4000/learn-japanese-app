"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHROMATIC,
  detectKey,
  getKey,
  MODES,
  pcToFreq,
  tonicName,
  type Mode,
} from "@/lib/theory";
import SongAnalyzer from "@/app/components/SongAnalyzer";

// ---- keyboard geometry: 2 octaves + final C = 15 white keys ----
const WHITE_PCS = [0, 2, 4, 5, 7, 9, 11];
const BASE_OCT = 4;

type WhiteKey = { pc: number; octave: number };
type BlackKey = { pc: number; octave: number; unit: number };

const WHITE_KEYS: WhiteKey[] = [];
for (const oct of [0, 1]) {
  for (const pc of WHITE_PCS) WHITE_KEYS.push({ pc, octave: BASE_OCT + oct });
}
WHITE_KEYS.push({ pc: 0, octave: BASE_OCT + 2 });

const BLACK_TEMPLATE = [
  { pc: 1, unit: 1 },
  { pc: 3, unit: 2 },
  { pc: 6, unit: 4 },
  { pc: 8, unit: 5 },
  { pc: 10, unit: 6 },
];
const BLACK_KEYS: BlackKey[] = [];
for (const oct of [0, 1]) {
  for (const b of BLACK_TEMPLATE) {
    BLACK_KEYS.push({ pc: b.pc, octave: BASE_OCT + oct, unit: b.unit + oct * 7 });
  }
}
const UNIT = 100 / WHITE_KEYS.length;

// letter hotkeys jump straight to a natural-note root
const LETTER_PC: Record<string, number> = {
  c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11,
};

export default function Home() {
  const [rootPc, setRootPc] = useState(0);
  const [mode, setMode] = useState<Mode>("major");
  const [bump, setBump] = useState(0); // re-trigger entrance animation
  const [picked, setPicked] = useState<Set<number>>(new Set());

  const info = useMemo(() => getKey(rootPc, mode), [rootPc, mode]);
  const nameByPc = useMemo(() => {
    const m = new Map<number, string>();
    for (const n of info.scale) m.set(n.pc, n.name);
    return m;
  }, [info]);

  // ---- audio ----
  const ctxRef = useRef<AudioContext | null>(null);
  const playNote = useCallback((pc: number, octave: number) => {
    try {
      if (!ctxRef.current) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        ctxRef.current = new AC();
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") void ctx.resume();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = pcToFreq(pc, octave);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.28, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.95);
    } catch {
      /* audio not available */
    }
  }, []);

  const playChord = useCallback(
    (pcs: number[]) => {
      pcs.forEach((pc, i) => {
        const octave = i === 0 ? 4 : pc < pcs[0] ? 5 : 4;
        setTimeout(() => playNote(pc, octave), i * 18);
      });
    },
    [playNote],
  );

  const selectRoot = useCallback((pc: number) => {
    setRootPc(pc);
    setBump((b) => b + 1);
  }, []);

  const shuffle = useCallback(() => {
    setRootPc((prev) => {
      let next = prev;
      while (next === prev) next = Math.floor(Math.random() * 12);
      return next;
    });
    setMode(MODES[Math.floor(Math.random() * MODES.length)].id);
    setBump((b) => b + 1);
  }, []);

  const step = useCallback((dir: number) => {
    setRootPc((p) => (p + dir + 12) % 12);
    setBump((b) => b + 1);
  }, []);

  // cycle through the modes list (↑/↓ and M)
  const cycleMode = useCallback((dir: number) => {
    setMode((m) => {
      const i = MODES.findIndex((x) => x.id === m);
      return MODES[(i + dir + MODES.length) % MODES.length].id;
    });
    setBump((b) => b + 1);
  }, []);

  // ---- key detector (reverse lookup) ----
  const togglePick = useCallback(
    (pc: number) => {
      setPicked((prev) => {
        const next = new Set(prev);
        if (next.has(pc)) next.delete(pc);
        else {
          next.add(pc);
          playNote(pc, 4);
        }
        return next;
      });
    },
    [playNote],
  );

  const matches = useMemo(() => {
    const vec = Array.from({ length: 12 }, (_, pc) => (picked.has(pc) ? 1 : 0));
    return detectKey(vec);
  }, [picked]);

  const useMatch = useCallback((pc: number, m: Mode) => {
    setRootPc(pc);
    setMode(m);
    setBump((b) => b + 1);
  }, []);

  // ---- keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat && e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const k = e.key.toLowerCase();
      if (k === "arrowright") step(1);
      else if (k === "arrowleft") step(-1);
      else if (k === "arrowup") {
        e.preventDefault();
        cycleMode(-1);
      } else if (k === "arrowdown") {
        e.preventDefault();
        cycleMode(1);
      } else if (k === "m") cycleMode(1);
      else if (k === " ") {
        e.preventDefault();
        shuffle();
      } else if (k in LETTER_PC) {
        selectRoot(LETTER_PC[k]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, shuffle, selectRoot, cycleMode]);

  const modeDef = MODES.find((m) => m.id === mode)!;
  // semitones the mode's tonic sits above its parent-major tonic
  const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11];
  const parentMajor = getKey((rootPc - MAJOR_STEPS[modeDef.degree] + 12) % 12, "major");
  const relativeLine =
    mode === "major" ? (
      <>rel. <b>{getKey((rootPc + 9) % 12, "minor").tonic}m</b></>
    ) : mode === "minor" ? (
      <>rel. <b>{getKey((rootPc + 3) % 12, "major").tonic}</b></>
    ) : (
      <>of <b>{parentMajor.tonic} maj</b></>
    );

  return (
    <main className="wrap">
      <header className="topbar">
        <div className="brand">
          <span className="dot" />
          keyfinder
        </div>
        <div className="kbd mono" aria-hidden>
          <kbd>←</kbd>
          <kbd>→</kbd>
          <span>key</span>
          <kbd>M</kbd>
          <span>mode</span>
          <kbd>␣</kbd>
          <span>random</span>
        </div>
      </header>

      <section className="hero" key={bump}>
        <h1 className="keyname animate">
          <span>{info.tonic}</span>
          <span className="qual">{modeDef.name.toLowerCase()}</span>
        </h1>
        <div className="meta mono">
          <span>
            {info.signature.type === "natural" ? (
              "no ♯ / ♭"
            ) : (
              <>
                <b>{info.signature.count}</b>
                {info.signature.type === "sharp" ? " ♯" : " ♭"}
              </>
            )}
          </span>
          <span className="sep">·</span>
          <span>{relativeLine}</span>
        </div>

        <div className="scale-strip">
          {info.scale.map((n) => (
            <button
              key={n.degree}
              className={`note-pill ${n.pc === rootPc ? "root" : ""}`}
              onClick={() => playNote(n.pc, n.pc < rootPc ? 5 : 4)}
              title={`Play ${n.name}`}
            >
              {n.name}
            </button>
          ))}
        </div>
      </section>

      <div className="controls">
        <div className="stepper">
          <button onClick={() => step(-1)} title="Previous root (←)">◄</button>
          <button onClick={() => step(1)} title="Next root (→)">►</button>
        </div>
        <button className="shuffle" onClick={shuffle} title="Random (space)">
          ⤮ random
        </button>
      </div>

      <div className="modes">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-pill ${m.id === mode ? "on" : ""}`}
            onClick={() => {
              setMode(m.id);
              setBump((b) => b + 1);
            }}
            title={m.name}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="roots">
        {Array.from({ length: 12 }, (_, pc) => (
          <button
            key={pc}
            className={`root-btn ${pc === rootPc ? "active" : ""}`}
            onClick={() => selectRoot(pc)}
          >
            {tonicName(pc, mode)}
          </button>
        ))}
      </div>

      <div className="kb-wrap">
        <div className="keyboard">
          {WHITE_KEYS.map((k, i) => {
            const inScale = info.pcs.has(k.pc);
            const isRoot = k.pc === rootPc;
            return (
              <div
                key={`w${i}`}
                className={`wkey ${isRoot ? "root" : inScale ? "inscale" : ""}`}
                onClick={() => {
                  playNote(k.pc, k.octave);
                  selectRoot(k.pc);
                }}
              >
                {inScale && <span className="klabel">{nameByPc.get(k.pc)}</span>}
              </div>
            );
          })}
          <div className="bkeys">
            {BLACK_KEYS.map((k, i) => {
              const inScale = info.pcs.has(k.pc);
              const isRoot = k.pc === rootPc;
              return (
                <div
                  key={`b${i}`}
                  className={`bkey ${isRoot ? "root" : inScale ? "inscale" : ""}`}
                  style={{ left: `${k.unit * UNIT}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    playNote(k.pc, k.octave);
                    selectRoot(k.pc);
                  }}
                >
                  {inScale && <span className="klabel">{nameByPc.get(k.pc)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="chord-grid" key={`c${bump}`}>
        {info.chords.map((c, i) => {
          const triad = [
            info.scale[i].pc,
            info.scale[(i + 2) % 7].pc,
            info.scale[(i + 4) % 7].pc,
          ];
          return (
            <button
              key={i}
              className="chord"
              onClick={() => playChord(triad)}
              title={`Play ${c.name}`}
            >
              <span className="rn mono">{c.roman}</span>
              <span className="cn">{c.name}</span>
            </button>
          );
        })}
      </div>

      <section className="detect">
        <div className="detect-head">
          <span className="detect-title mono">Detect a key</span>
          <span className="detect-sub mono">
            click the notes — we&apos;ll name the key
          </span>
          {picked.size > 0 && (
            <button className="clear" onClick={() => setPicked(new Set())}>
              clear
            </button>
          )}
        </div>

        <div className="kb-wrap">
          <div className="keyboard pick-kb">
            {WHITE_KEYS.map((k, i) => (
              <div
                key={`dw${i}`}
                className={`wkey ${picked.has(k.pc) ? "sel" : ""}`}
                onClick={() => togglePick(k.pc)}
              >
                {picked.has(k.pc) && (
                  <span className="klabel">{CHROMATIC[k.pc]}</span>
                )}
              </div>
            ))}
            <div className="bkeys">
              {BLACK_KEYS.map((k, i) => (
                <div
                  key={`db${i}`}
                  className={`bkey ${picked.has(k.pc) ? "sel" : ""}`}
                  style={{ left: `${k.unit * UNIT}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePick(k.pc);
                  }}
                >
                  {picked.has(k.pc) && (
                    <span className="klabel">{CHROMATIC[k.pc]}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="results">
          {picked.size === 0 ? (
            <p className="results-empty mono">
              pick at least one note to identify the key
            </p>
          ) : (
            matches.slice(0, 3).map((m, i) => {
              const total = picked.size;
              const inKey = total - m.missing;
              return (
                <button
                  key={m.label}
                  className={`match ${i === 0 ? "best" : ""}`}
                  onClick={() => useMatch(m.rootPc, m.mode)}
                  title="Load this key in the explorer above"
                >
                  <span className="match-rank mono">{i === 0 ? "best" : `#${i + 1}`}</span>
                  <span className="match-name">{m.label}</span>
                  <span className="match-bar" aria-hidden>
                    <span
                      className={m.missing === 0 ? "full" : ""}
                      style={{ width: `${(inKey / total) * 100}%` }}
                    />
                  </span>
                  <span className="match-pct mono">
                    {inKey}/{total}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>

      <SongAnalyzer
        playChord={playChord}
        playNote={playNote}
        onUseKey={(pc, m) => {
          useMatch(pc, m);
          if (typeof window !== "undefined")
            window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </main>
  );
}
