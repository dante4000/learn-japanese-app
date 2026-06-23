"use client";

import { useMemo, useRef, useState } from "react";
import { NetWorthSnapshot } from "@/lib/types";
import { formatMoney, formatCompact, formatDate } from "@/lib/format";

/** "Nice" rounded tick values spanning [min, max] for a readable Y axis. */
function niceTicks(min: number, max: number, count = 4) {
  const range = max - min || Math.abs(max) || 1;
  const rawStep = range / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) ticks.push(v);
  return { ticks, niceMin, niceMax };
}

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(iso + (iso.length === 10 ? "T00:00:00" : "")),
  );

const parseTime = (iso: string) =>
  new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).getTime();

/**
 * Smooth monotone-cubic path through `pts` (Fritsch–Carlson tangents). Unlike a
 * plain Catmull-Rom spline it never overshoots, so a sharp net-worth jump stays
 * truthful instead of dipping below the data.
 */
function monotonePath(pts: readonly (readonly [number, number])[]): string {
  const n = pts.length;
  if (n < 2) return n ? `M${pts[0][0]},${pts[0][1]}` : "";
  if (n === 2)
    return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`;

  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = xs[i + 1] - xs[i];
    slope[i] = (ys[i + 1] - ys[i]) / (dx[i] || 1);
  }
  const t: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) {
      t[i] = 0;
    } else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      t[i] = (w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]);
    }
  }
  t[n - 1] = slope[n - 2];

  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const x1 = xs[i] + dx[i] / 3;
    const y1 = ys[i] + (t[i] * dx[i]) / 3;
    const x2 = xs[i + 1] - dx[i] / 3;
    const y2 = ys[i + 1] - (t[i + 1] * dx[i]) / 3;
    d += ` C${x1},${y1} ${x2},${y2} ${xs[i + 1]},${ys[i + 1]}`;
  }
  return d;
}

const RANGES = [
  { key: "1M", days: 30, label: "1M", phrase: "past month" },
  { key: "3M", days: 90, label: "3M", phrase: "past 3 months" },
  { key: "6M", days: 180, label: "6M", phrase: "past 6 months" },
  { key: "1Y", days: 365, label: "1Y", phrase: "past year" },
  { key: "ALL", days: Infinity, label: "All", phrase: "all time" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

/** Area line of net worth over time — interactive, with range tabs + tooltip. */
export function NetWorthArea({
  snapshots,
  currency = "USD",
  width = 720,
  height = 260,
}: {
  snapshots: NetWorthSnapshot[];
  currency?: string;
  width?: number;
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rangeKey, setRangeKey] = useState<RangeKey>("ALL");
  const [hover, setHover] = useState<number | null>(null);

  // Which range tabs actually trim something (always offer "All").
  const ranges = useMemo(() => {
    if (snapshots.length < 2) return [];
    const first = parseTime(snapshots[0].date);
    const last = parseTime(snapshots[snapshots.length - 1].date);
    const spanDays = (last - first) / 86_400_000;
    return RANGES.filter(
      (r) => r.key === "ALL" || (r.days < spanDays && spanDays > 0),
    );
  }, [snapshots]);

  const range =
    RANGES.find((r) => r.key === rangeKey) ?? RANGES[RANGES.length - 1];

  // Snapshots inside the selected window.
  const data = useMemo(() => {
    if (range.days === Infinity) return snapshots;
    const last = parseTime(snapshots[snapshots.length - 1]?.date ?? "");
    const cutoff = last - range.days * 86_400_000;
    const win = snapshots.filter((s) => parseTime(s.date) >= cutoff);
    return win.length >= 2 ? win : snapshots;
  }, [snapshots, range.days]);

  if (snapshots.length < 2) {
    return (
      <div className="grid h-40 place-items-center text-sm text-muted">
        Net worth trend appears once you have a few days of history.
      </div>
    );
  }

  const m = { top: 14, right: 18, bottom: 28, left: 60 };
  const plotW = width - m.left - m.right;
  const plotH = height - m.top - m.bottom;

  const values = data.map((s) => s.netWorth);
  const { ticks, niceMin, niceMax } = niceTicks(
    Math.min(...values),
    Math.max(...values),
  );
  const span = niceMax - niceMin || 1;

  const x = (i: number) =>
    m.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => m.top + (1 - (v - niceMin) / span) * plotH;

  const pts = data.map((s, i) => [x(i), y(s.netWorth)] as const);
  const line = monotonePath(pts);
  const baseY = m.top + plotH;
  const area = `${line} L${pts[pts.length - 1][0]},${baseY} L${pts[0][0]},${baseY} Z`;

  // Period change across the visible window.
  const startV = data[0].netWorth;
  const endV = data[data.length - 1].netWorth;
  const delta = endV - startV;
  const pct = startV > 0 ? (delta / startV) * 100 : null;
  const up = delta >= 0;

  // X labels: first, last, and evenly spaced in between (~5 max).
  const maxLabels = 5;
  const stride = Math.max(1, Math.ceil((data.length - 1) / (maxLabels - 1)));
  const xLabelIdx = new Set<number>([data.length - 1]);
  for (let i = 0; i < data.length; i += stride) xLabelIdx.add(i);

  const hi = hover == null ? null : Math.min(hover, data.length - 1);
  const active = hi ?? data.length - 1; // emphasized point (hover, else latest)

  function moveTo(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * width;
    let i = Math.round(((px - m.left) / plotW) * (data.length - 1));
    i = Math.max(0, Math.min(data.length - 1, i));
    setHover(i);
  }

  const tipPct = Math.min(88, Math.max(12, (x(active) / width) * 100));
  const tip = data[active];

  return (
    <div>
      {/* Controls: period change · range tabs */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2 text-sm">
          <span
            className={`tnum font-medium ${up ? "text-blue" : "text-coral"}`}
          >
            {up ? "▲" : "▼"} {formatMoney(delta, currency, { sign: true, cents: false })}
          </span>
          {pct != null && (
            <span className={`tnum text-xs ${up ? "text-blue" : "text-coral"}`}>
              {up ? "+" : "−"}
              {Math.abs(pct).toFixed(1)}%
            </span>
          )}
          <span className="text-xs text-muted">· {range.phrase}</span>
        </div>

        {ranges.length > 1 && (
          <div className="flex items-center gap-0.5 rounded-lg border hairline bg-surface-2 p-0.5">
            {ranges.map((r) => {
              const on = r.key === rangeKey;
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => {
                    setRangeKey(r.key);
                    setHover(null);
                  }}
                  aria-pressed={on}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    on
                      ? "bg-[var(--color-surface)] text-cream shadow-sm"
                      : "text-muted hover:text-cream-dim"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="relative"
        onMouseMove={(e) => moveTo(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => moveTo(e.touches[0].clientX)}
        onTouchMove={(e) => moveTo(e.touches[0].clientX)}
        onTouchEnd={() => setHover(null)}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full touch-none select-none"
          role="img"
          aria-label={`Net worth over time. ${formatMoney(endV, currency, {
            cents: false,
          })} now, ${up ? "up" : "down"} ${formatMoney(delta, currency, {
            cents: false,
          })} ${range.phrase}.`}
        >
          <defs>
            <linearGradient id="nwfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-blue)" stopOpacity="0.26" />
              <stop offset="55%" stopColor="var(--color-blue)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="var(--color-blue)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="nwline" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-blue-deep)" />
              <stop offset="100%" stopColor="var(--color-blue)" />
            </linearGradient>
          </defs>

          {/* Y gridlines + labels */}
          {ticks.map((v, i) => {
            const gy = y(v);
            const zero = Math.abs(v) < 1e-6;
            return (
              <g key={`y${i}`}>
                <line
                  x1={m.left}
                  x2={width - m.right}
                  y1={gy}
                  y2={gy}
                  stroke={zero ? "var(--color-line-2)" : "var(--color-line)"}
                  strokeWidth={1}
                  strokeDasharray={zero ? undefined : "2 5"}
                />
                <text
                  x={m.left - 10}
                  y={gy}
                  textAnchor="end"
                  dominantBaseline="central"
                  fill="var(--color-faint)"
                  className="tnum"
                  fontSize={11}
                >
                  {formatCompact(v, currency)}
                </text>
              </g>
            );
          })}

          <path d={area} fill="url(#nwfill)" />
          <path
            d={line}
            fill="none"
            stroke="url(#nwline)"
            strokeWidth={2.25}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* X labels */}
          {[...xLabelIdx]
            .sort((a, b) => a - b)
            .map((i) => {
              const isFirst = i === 0;
              const isLast = i === data.length - 1;
              return (
                <text
                  key={`x${i}`}
                  x={x(i)}
                  y={height - 8}
                  textAnchor={isFirst ? "start" : isLast ? "end" : "middle"}
                  fill="var(--color-faint)"
                  fontSize={11}
                >
                  {shortDate(data[i].date)}
                </text>
              );
            })}

          {/* Quiet dot per snapshot */}
          {pts.map((p, i) => (
            <circle
              key={i}
              cx={p[0]}
              cy={p[1]}
              r={i === active ? 0 : 2}
              fill="var(--color-blue)"
              opacity={0.45}
            />
          ))}

          {/* Crosshair + emphasized point */}
          {hi != null && (
            <line
              x1={x(hi)}
              x2={x(hi)}
              y1={m.top}
              y2={baseY}
              stroke="var(--color-line-2)"
              strokeWidth={1}
              strokeDasharray="3 4"
            />
          )}
          <circle
            cx={x(active)}
            cy={y(data[active].netWorth)}
            r={7}
            fill="var(--color-blue)"
            opacity={0.16}
          >
            {hi == null && (
              <animate
                attributeName="r"
                values="6;10;6"
                dur="2.4s"
                repeatCount="indefinite"
              />
            )}
          </circle>
          <circle
            cx={x(active)}
            cy={y(data[active].netWorth)}
            r={4}
            fill="var(--color-blue)"
            stroke="var(--color-surface)"
            strokeWidth={2}
          />
        </svg>

        {/* Tooltip rides horizontally above the hovered point */}
        {hi != null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2"
          style={{ left: `${tipPct}%` }}
        >
          <div className="rounded-xl border hairline bg-[var(--color-surface)] px-3 py-2 shadow-lg shadow-black/5">
            <div className="text-[11px] font-medium text-muted">
              {formatDate(tip.date)}
            </div>
            <div className="tnum mt-0.5 text-base font-medium text-cream">
              {formatMoney(tip.netWorth, currency, { cents: false })}
            </div>
            <div className="mt-1 flex gap-3 text-[11px]">
              <span className="tnum text-blue">
                {formatMoney(tip.totalAssets, currency, { cents: false })}
                <span className="ml-1 text-muted">assets</span>
              </span>
              <span className="tnum text-coral">
                {formatMoney(tip.totalLiabilities, currency, { cents: false })}
                <span className="ml-1 text-muted">owed</span>
              </span>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
