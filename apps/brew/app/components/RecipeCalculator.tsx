"use client";

import { useMemo } from "react";
import type { Recipe } from "@/lib/recipes";
import { useBrew } from "./BrewProvider";

const accentVar: Record<Recipe["accent"], string> = {
  vermilion: "var(--vermilion)",
  indigo: "var(--indigo)",
  ochre: "var(--ochre)",
};

/** trim trailing zeros, keep up to `d` decimals */
function num(n: number, d = 2): string {
  if (!isFinite(n)) return "0";
  const r = Math.round(n * 10 ** d) / 10 ** d;
  return r.toString();
}
function grams(n: number): string {
  if (n <= 0) return "—";
  if (n >= 1000) return `${num(n / 1000, 2)} kg`;
  return `${Math.round(n)} g`;
}
function litres(n: number): string {
  if (n <= 0) return "none";
  if (n < 1) return `${Math.round(n * 1000)} mL`;
  return `${num(n, 2)} L`;
}

export default function RecipeCalculator({ recipe }: { recipe: Recipe }) {
  const baseNuruk = useMemo(
    () => recipe.stages.reduce((s, st) => s + st.nuruk, 0),
    [recipe],
  );
  const baseWater = useMemo(
    () => recipe.stages.reduce((s, st) => s + st.water, 0),
    [recipe],
  );

  const { rice, nuruk, saving, customized, setSlice } = useBrew(recipe.id, {
    rice: recipe.baseRice,
    nuruk: baseNuruk,
  });

  const scale = rice / recipe.baseRice;

  // changing rice keeps the nuruk ratio (so "change rice → everything adjusts")
  function changeRice(next: number) {
    const r = Math.max(0.5, Math.round(next * 100) / 100);
    setSlice({
      rice: r,
      nuruk: Math.round(((baseNuruk * r) / recipe.baseRice) * 10) / 10,
    });
  }
  function changeNuruk(next: number) {
    setSlice({ rice, nuruk: Math.max(0, Math.round(next)) });
  }
  function reset() {
    setSlice({ rice: recipe.baseRice, nuruk: baseNuruk });
  }

  const totalWater = baseWater * scale;
  const ratio = totalWater > 0 && rice > 0 ? totalWater / rice : 0;
  const nurukPct = rice > 0 ? (nuruk / (rice * 1000)) * 100 : 0;
  const accent = accentVar[recipe.accent];

  return (
    <div>
      {/* ---- control bar ---- */}
      <div
        className="card rounded-lg p-5 sm:p-6"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
          <Dial
            label="Total rice"
            sub="쌀"
            value={`${num(rice)}`}
            unit="kg"
            onMinus={() => changeRice(rice - 0.1)}
            onPlus={() => changeRice(rice + 0.1)}
            onInput={(v) => changeRice(v)}
            accent={accent}
          />
          <Dial
            label="Total nuruk"
            sub="누룩"
            value={`${Math.round(nuruk)}`}
            unit="g"
            onMinus={() => changeNuruk(nuruk - 25)}
            onPlus={() => changeNuruk(nuruk + 25)}
            onInput={(v) => changeNuruk(v)}
            accent={accent}
          />

          <div className="ml-auto flex flex-wrap gap-x-7 gap-y-2 text-sm">
            <Readout label="Water" value={litres(totalWater)} />
            <Readout
              label="Rice : water"
              value={ratio > 0 ? `1 : ${num(ratio, 2)}` : "—"}
            />
            <Readout
              label="Nuruk : rice"
              value={nurukPct > 0 ? `${num(nurukPct, 1)}%` : "—"}
              accent={accent}
            />
            <Readout label="Scale" value={`${num(scale, 2)}×`} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-[0.8rem] leading-relaxed text-[var(--ink-faint)]">
            Nudge the rice and every stage below re-scales live — water and flour
            follow the rice; change the nuruk on its own and it redistributes
            across the stages by its original split.
          </p>
          <div className="flex items-center gap-3 text-[0.72rem] tracky">
            <span
              className="flex items-center gap-1.5 text-[var(--ink-faint)]"
              title="Saved to your Vercel Blob — persists across sessions"
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{
                  background: saving ? "var(--ochre)" : "var(--jade, #4a6b4f)",
                }}
              />
              {saving ? "saving…" : "saved"}
            </span>
            {customized && (
              <button
                onClick={reset}
                className="pill rounded-full px-3 py-1 text-[0.68rem]"
              >
                reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---- stages ---- */}
      <ol className="mt-7 space-y-px">
        {recipe.stages.map((st, i) => {
          const r = st.rice * scale;
          const w = st.water * scale;
          const f = st.flour * scale;
          const n = baseNuruk > 0 ? (st.nuruk / baseNuruk) * nuruk : 0;
          return (
            <li
              key={st.name}
              className="stage-grid items-stretch border-b py-5"
              style={{ borderColor: "var(--line-soft)" }}
            >
              <div className="flex flex-col items-center pt-1">
                <span
                  className="seal kr text-[0.95rem]"
                  style={{
                    width: "2rem",
                    height: "2rem",
                    background: accent,
                  }}
                >
                  {st.ko}
                </span>
                {i < recipe.stages.length - 1 && (
                  <span
                    className="mt-1 w-px flex-1"
                    style={{ background: "var(--line)" }}
                  />
                )}
              </div>

              <div className="pl-1">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h4 className="kr text-lg font-semibold">{st.name}</h4>
                  <span className="text-[0.78rem] tracky text-[var(--ink-faint)]">
                    {st.when}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                  <Quantity
                    big={`${num(r)} kg`}
                    label={
                      <>
                        <span className="kr">{st.riceType}</span> ·{" "}
                        <span className="kr">{st.form}</span>{" "}
                        <span className="text-[var(--ink-faint)]">
                          ({st.formEn})
                        </span>
                      </>
                    }
                    accent={accent}
                  />
                  <Quantity
                    big={litres(w)}
                    label="water"
                    muted={w <= 0}
                  />
                  {baseNuruk > 0 && (
                    <Quantity
                      big={grams(n)}
                      label="nuruk 누룩"
                      muted={n <= 0}
                    />
                  )}
                  {f > 0 && <Quantity big={grams(f)} label="flour 밀가루" />}
                </div>

                {st.note && (
                  <p className="mt-2.5 max-w-prose text-[0.88rem] italic leading-relaxed text-[var(--ink-soft)]">
                    {st.note}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Dial({
  label,
  sub,
  value,
  unit,
  onMinus,
  onPlus,
  onInput,
  accent,
}: {
  label: string;
  sub: string;
  value: string;
  unit: string;
  onMinus: () => void;
  onPlus: () => void;
  onInput: (v: number) => void;
  accent: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-[0.7rem] tracky text-[var(--ink-faint)]">
          {label}
        </span>
        <span className="kr text-sm" style={{ color: accent }}>
          {sub}
        </span>
      </div>
      <div className="flex items-stretch gap-1.5">
        <button
          className="stepper h-11 w-9 text-xl"
          onClick={onMinus}
          aria-label={`decrease ${label}`}
        >
          −
        </button>
        <div className="relative">
          <input
            type="number"
            value={value}
            onChange={(e) => onInput(parseFloat(e.target.value) || 0)}
            className="dial h-11 w-24 pl-3 pr-9 text-2xl"
            aria-label={label}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--ink-faint)]">
            {unit}
          </span>
        </div>
        <button
          className="stepper h-11 w-9 text-xl"
          onClick={onPlus}
          aria-label={`increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Readout({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <div className="text-[0.66rem] tracky text-[var(--ink-faint)]">
        {label}
      </div>
      <div
        className="amt text-lg"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

function Quantity({
  big,
  label,
  accent,
  muted,
}: {
  big: string;
  label: React.ReactNode;
  accent?: string;
  muted?: boolean;
}) {
  return (
    <div className={muted ? "opacity-45" : ""}>
      <span
        className="amt text-xl"
        style={accent ? { color: accent } : undefined}
      >
        {big}
      </span>{" "}
      <span className="text-[0.82rem] text-[var(--ink-soft)]">{label}</span>
    </div>
  );
}
