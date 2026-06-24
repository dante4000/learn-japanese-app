"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const parseTime = (iso: string) =>
  new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).getTime();

const monthOf = (iso: string) => iso.slice(0, 7); // yyyy-mm

/** Short month tick, with a year suffix in January or at the very first label. */
function monthTick(iso: string, withYear: boolean): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  const mon = new Intl.DateTimeFormat("en-US", { month: "short" }).format(d);
  if (d.getMonth() === 0 || withYear)
    return `${mon} ’${String(d.getFullYear()).slice(2)}`;
  return mon;
}

/**
 * Smooth monotone-cubic path through `pts` (Fritsch–Carlson tangents) — never
 * overshoots, so a sharp net-worth jump stays truthful.
 */
function monotonePath(pts: readonly (readonly [number, number])[]): string {
  const n = pts.length;
  if (n < 2) return n ? `M${pts[0][0]},${pts[0][1]}` : "";
  if (n === 2) return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`;

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
    if (slope[i - 1] * slope[i] <= 0) t[i] = 0;
    else {
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

/**
 * Collapse to one point per bucket (week or month): keep the bucket's last
 * *balance* (net worth is a stock, not a flow) but SUM income/spending across
 * the bucket (those are flows), so long spans stay legible without losing the
 * period's cash-flow totals.
 */
function downsample(
  snaps: NetWorthSnapshot[],
  cadence: "day" | "week" | "month",
): NetWorthSnapshot[] {
  if (cadence === "day") return snaps;
  const buckets = new Map<string, NetWorthSnapshot>();
  for (const s of snaps) {
    const key =
      cadence === "month"
        ? monthOf(s.date)
        : String(Math.floor(parseTime(s.date) / (7 * 86_400_000)));
    const prev = buckets.get(key);
    // snaps are sorted, so `s` carries the latest balance for the bucket.
    buckets.set(key, {
      ...s,
      income: (prev?.income ?? 0) + (s.income ?? 0),
      spending: (prev?.spending ?? 0) + (s.spending ?? 0),
    });
  }
  return [...buckets.values()];
}

const RANGES = [
  { key: "1M", days: 30, label: "1M", phrase: "past month" },
  { key: "3M", days: 90, label: "3M", phrase: "past 3 months" },
  { key: "6M", days: 180, label: "6M", phrase: "past 6 months" },
  { key: "1Y", days: 365, label: "1Y", phrase: "past year" },
  { key: "ALL", days: Infinity, label: "All", phrase: "all time" },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

// Per-point horizontal spacing (px) by cadence — wide enough that months read.
const STEP: Record<"day" | "week" | "month", number> = {
  day: 11,
  week: 24,
  month: 46,
};

const PAD_X = 12;
const AXIS_W = 56;
const M_TOP = 16;
const FLOW_GAP = 12; // gap between net-worth plot and the cash-flow strip
const FLOW_H = 34; // height of the income/spending bar strip
const LABEL_H = 22; // room for month labels under the strip
const M_BOTTOM = FLOW_GAP + FLOW_H + LABEL_H;
const NW_H = 216; // net-worth plot height
const H = M_TOP + NW_H + M_BOTTOM;

/** Scrollable net-worth timeline — range tabs, fixed Y axis, month markers, hover tooltip. */
export function NetWorthArea({
  snapshots,
  currency = "USD",
}: {
  snapshots: NetWorthSnapshot[];
  currency?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [rangeKey, setRangeKey] = useState<RangeKey>("ALL");
  const [hover, setHover] = useState<number | null>(null);
  const [vw, setVw] = useState(640); // measured scroll-viewport width

  // Which range tabs actually trim something (always offer "All").
  const ranges = useMemo(() => {
    if (snapshots.length < 2) return [];
    const spanDays =
      (parseTime(snapshots[snapshots.length - 1].date) -
        parseTime(snapshots[0].date)) /
      86_400_000;
    return RANGES.filter((r) => r.key === "ALL" || r.days < spanDays);
  }, [snapshots]);

  const range = RANGES.find((r) => r.key === rangeKey) ?? RANGES[RANGES.length - 1];

  // Snapshots inside the window, then downsampled by span so the line stays clean.
  const data = useMemo(() => {
    if (snapshots.length < 2) return snapshots;
    const last = parseTime(snapshots[snapshots.length - 1].date);
    const win =
      range.days === Infinity
        ? snapshots
        : snapshots.filter(
            (s) => parseTime(s.date) >= last - range.days * 86_400_000,
          );
    const scoped = win.length >= 2 ? win : snapshots;
    const spanDays =
      (parseTime(scoped[scoped.length - 1].date) - parseTime(scoped[0].date)) /
      86_400_000;
    const cadence: "day" | "week" | "month" =
      spanDays <= 95 ? "day" : spanDays <= 740 ? "week" : "month";
    return downsample(scoped, cadence);
  }, [snapshots, range.days]);

  const cadence: "day" | "week" | "month" = useMemo(() => {
    if (data.length < 2) return "day";
    const spanDays =
      (parseTime(data[data.length - 1].date) - parseTime(data[0].date)) /
      86_400_000;
    return spanDays <= 95 ? "day" : spanDays <= 740 ? "week" : "month";
  }, [data]);

  // Measure the scroll viewport so the plot can fill it (few points) or overflow
  // it (many points → horizontal scroll).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setVw(el.clientWidth));
    ro.observe(el);
    setVw(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const n = data.length;
  const plotW = Math.max(vw, (n - 1) * STEP[cadence] + 2 * PAD_X);
  const plotH = NW_H;

  const values = data.map((s) => s.netWorth);
  const { ticks, niceMin, niceMax } = niceTicks(
    n ? Math.min(...values) : 0,
    n ? Math.max(...values) : 1,
  );
  const span = niceMax - niceMin || 1;

  const x = (i: number) =>
    n <= 1 ? plotW / 2 : PAD_X + (i / (n - 1)) * (plotW - 2 * PAD_X);
  const y = (v: number) => M_TOP + (1 - (v - niceMin) / span) * plotH;

  // Auto-scroll to the most recent point whenever the range/width changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [rangeKey, n, plotW]);

  // Month boundaries → vertical gridline + label.
  const monthMarks = useMemo(() => {
    const marks: { x: number; label: string }[] = [];
    let prev = "";
    data.forEach((s, i) => {
      const m = monthOf(s.date);
      if (m !== prev) {
        marks.push({ x: x(i), label: monthTick(s.date, marks.length === 0) });
        prev = m;
      }
    });
    return marks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, plotW]);

  // Which month marks actually get a *label*. Greedily drop labels that would
  // collide with the previously drawn one (the gridline still shows), and pin
  // the rightmost label inside the plot so it never clips at the scroll edge.
  const monthLabels = useMemo(() => {
    const out: { x: number; anchor: "start" | "end"; label: string }[] = [];
    let lastRight = -Infinity;
    for (const mk of monthMarks) {
      const w = mk.label.length * 6.2 + 4; // ~px at fontSize 11
      if (mk.x < lastRight + 6) continue; // too close → keep gridline, drop text
      let lx = mk.x + 4;
      let anchor: "start" | "end" = "start";
      if (lx + w > plotW - 1) {
        lx = plotW - 2;
        anchor = "end";
        if (lx - w < lastRight + 6) continue; // would still overlap → skip
      }
      out.push({ x: lx, anchor, label: mk.label });
      lastRight = anchor === "end" ? plotW : lx + w;
    }
    return out;
  }, [monthMarks, plotW]);

  if (snapshots.length < 2) {
    return (
      <div className="grid h-40 place-items-center text-sm text-muted">
        Net worth trend appears once you have a few days of history.
      </div>
    );
  }

  const pts = data.map((s, i) => [x(i), y(s.netWorth)] as const);
  const line = monotonePath(pts);
  const baseY = M_TOP + plotH;
  const area = `${line} L${pts[n - 1][0]},${baseY} L${pts[0][0]},${baseY} Z`;

  // Cash-flow strip: income bars grow up from the centerline, spending down.
  const flowTop = baseY + FLOW_GAP;
  const flowCenter = flowTop + FLOW_H / 2;
  const flowMax = Math.max(
    1,
    ...data.map((s) => Math.max(s.income ?? 0, s.spending ?? 0)),
  );
  const flowHalf = FLOW_H / 2 - 2;
  const barW = Math.max(2, Math.min(16, STEP[cadence] * 0.5));
  const flowH = (v: number) => (Math.max(0, v) / flowMax) * flowHalf;

  const startV = data[0].netWorth;
  const endV = data[n - 1].netWorth;
  const delta = endV - startV;
  const pct = startV > 0 ? (delta / startV) * 100 : null;
  const up = delta >= 0;

  const hi = hover == null ? null : Math.min(hover, n - 1);
  const active = hi ?? n - 1;
  const showDots = n <= 60;

  // Peak / trough within the visible window (skip if they land on the endpoint,
  // which already carries the live marker).
  let lo = 0;
  let peak = 0;
  data.forEach((s, i) => {
    if (s.netWorth < data[lo].netWorth) lo = i;
    if (s.netWorth > data[peak].netWorth) peak = i;
  });
  const extremes =
    n >= 4
      ? [
          { i: peak, kind: "peak" as const },
          { i: lo, kind: "low" as const },
        ].filter((e) => e.i !== n - 1 && e.i !== active)
      : [];

  // Remount the line/area when the window changes so the reveal animation replays.
  const revealKey = `${rangeKey}-${n}`;

  function moveTo(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = clientX - rect.left;
    let i = Math.round(((px - PAD_X) / (plotW - 2 * PAD_X)) * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    setHover(i);
  }

  const tip = data[active];
  const tipLeft = Math.min(plotW - 90, Math.max(90, x(active)));

  return (
    <div>
      {/* Controls: period change · range tabs */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2 text-sm">
          <span className={`tnum font-medium ${up ? "text-blue" : "text-coral"}`}>
            {up ? "▲" : "▼"}{" "}
            {formatMoney(delta, currency, { sign: true, cents: false })}
          </span>
          {pct != null && (
            <span className={`tnum text-xs ${up ? "text-blue" : "text-coral"}`}>
              {up ? "+" : "−"}
              {Math.abs(pct).toFixed(1)}%
            </span>
          )}
          <span className="text-xs text-muted">
            · {range.phrase}
            {cadence !== "day" ? ` · ${cadence}ly` : ""}
          </span>
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

      {/* Legend for the cash-flow strip */}
      <div className="mb-2 flex items-center gap-3 pl-[56px] text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-blue" />
          income
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-sm bg-coral" />
          spending
        </span>
      </div>

      <div className="flex">
        {/* Fixed Y axis — stays put while the plot scrolls */}
        <svg
          width={AXIS_W}
          height={H}
          className="shrink-0"
          aria-hidden
          style={{ overflow: "visible" }}
        >
          {ticks.map((v, i) => (
            <text
              key={i}
              x={AXIS_W - 8}
              y={y(v)}
              textAnchor="end"
              dominantBaseline="central"
              fill="var(--color-faint)"
              className="tnum"
              fontSize={11}
            >
              {formatCompact(v, currency)}
            </text>
          ))}
        </svg>

        {/* Scrollable plot */}
        <div
          ref={scrollRef}
          className="relative flex-1 overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth: "thin" }}
        >
          <div className="relative" style={{ width: plotW, height: H }}>
            <svg
              ref={svgRef}
              width={plotW}
              height={H}
              className="block select-none"
              role="img"
              aria-label={`Net worth over time. ${formatMoney(endV, currency, {
                cents: false,
              })} now, ${up ? "up" : "down"} ${formatMoney(delta, currency, {
                cents: false,
              })} ${range.phrase}.`}
              onMouseMove={(e) => moveTo(e.clientX)}
              onMouseLeave={() => setHover(null)}
              onTouchStart={(e) => moveTo(e.touches[0].clientX)}
              onTouchEnd={() => setHover(null)}
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

              {/* Horizontal gridlines */}
              {ticks.map((v, i) => {
                const gy = y(v);
                const zero = Math.abs(v) < 1e-6;
                return (
                  <line
                    key={`g${i}`}
                    x1={0}
                    x2={plotW}
                    y1={gy}
                    y2={gy}
                    stroke={zero ? "var(--color-line-2)" : "var(--color-line)"}
                    strokeWidth={1}
                    strokeDasharray={zero ? undefined : "2 5"}
                  />
                );
              })}

              {/* Month gridlines (every boundary) */}
              {monthMarks.map((mk, i) => (
                <line
                  key={`m${i}`}
                  x1={mk.x}
                  x2={mk.x}
                  y1={M_TOP}
                  y2={baseY}
                  stroke="var(--color-line)"
                  strokeWidth={1}
                  strokeDasharray="2 6"
                  opacity={0.6}
                />
              ))}

              {/* Month labels (collision-filtered, clamped to the plot) */}
              {monthLabels.map((mk, i) => (
                <text
                  key={`ml${i}`}
                  x={mk.x}
                  y={H - 9}
                  textAnchor={mk.anchor}
                  fill="var(--color-faint)"
                  fontSize={11}
                >
                  {mk.label}
                </text>
              ))}

              <path key={`a-${revealKey}`} d={area} fill="url(#nwfill)" opacity={0}>
                <animate
                  attributeName="opacity"
                  from="0"
                  to="1"
                  dur="0.5s"
                  begin="0.35s"
                  fill="freeze"
                />
              </path>
              <path
                key={`l-${revealKey}`}
                d={line}
                fill="none"
                stroke="url(#nwline)"
                strokeWidth={2.25}
                strokeLinejoin="round"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="1"
                  to="0"
                  dur="0.85s"
                  begin="0s"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1"
                  keyTimes="0;1"
                  fill="freeze"
                />
              </path>

              {/* Cash-flow strip: income up (blue), spending down (coral) */}
              <line
                x1={0}
                x2={plotW}
                y1={flowCenter}
                y2={flowCenter}
                stroke="var(--color-line)"
                strokeWidth={1}
              />
              {data.map((s, i) => {
                const cx = x(i);
                const inc = s.income ?? 0;
                const spd = s.spending ?? 0;
                const dim = hi != null && i !== active ? 0.45 : 1;
                return (
                  <g key={`f${i}`} opacity={dim}>
                    {inc > 0 && (
                      <rect
                        x={cx - barW / 2}
                        y={flowCenter - flowH(inc)}
                        width={barW}
                        height={flowH(inc)}
                        rx={Math.min(1.5, barW / 2)}
                        fill="var(--color-blue)"
                        opacity={0.85}
                      />
                    )}
                    {spd > 0 && (
                      <rect
                        x={cx - barW / 2}
                        y={flowCenter}
                        width={barW}
                        height={flowH(spd)}
                        rx={Math.min(1.5, barW / 2)}
                        fill="var(--color-coral)"
                        opacity={0.85}
                      />
                    )}
                  </g>
                );
              })}

              {showDots &&
                pts.map((p, i) => (
                  <circle
                    key={i}
                    cx={p[0]}
                    cy={p[1]}
                    r={i === active ? 0 : 2}
                    fill="var(--color-blue)"
                    opacity={0.4}
                  />
                ))}

              {/* Peak / trough markers for the visible window */}
              {hi == null &&
                extremes.map((e) => {
                  const px = x(e.i);
                  const py = y(data[e.i].netWorth);
                  const above = e.kind === "peak";
                  return (
                    <g key={e.kind} opacity={0.85}>
                      <circle
                        cx={px}
                        cy={py}
                        r={2.5}
                        fill="var(--color-surface)"
                        stroke={above ? "var(--color-blue)" : "var(--color-faint)"}
                        strokeWidth={1.5}
                      />
                      <text
                        x={px}
                        y={above ? py - 9 : py + 15}
                        textAnchor="middle"
                        fill={above ? "var(--color-blue)" : "var(--color-faint)"}
                        className="tnum"
                        fontSize={10}
                        fontWeight={600}
                      >
                        {formatCompact(data[e.i].netWorth, currency)}
                      </text>
                    </g>
                  );
                })}

              {/* Crosshair + emphasized point */}
              {hi != null && (
                <line
                  x1={x(hi)}
                  x2={x(hi)}
                  y1={M_TOP}
                  y2={flowCenter + FLOW_H / 2}
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

            {/* Tooltip rides with the plot (scrolls together) */}
            {hi != null && (
              <div
                className="pointer-events-none absolute top-0 z-10 -translate-x-1/2"
                style={{ left: tipLeft }}
              >
                <div className="rounded-xl border hairline bg-[var(--color-surface)] px-3 py-2 shadow-lg shadow-black/5">
                  <div className="text-[11px] font-medium text-muted">
                    {formatDate(tip.date)}
                  </div>
                  <div className="tnum mt-0.5 flex items-baseline gap-2">
                    <span className="text-base font-medium text-cream">
                      {formatMoney(tip.netWorth, currency, { cents: false })}
                    </span>
                    {(() => {
                      const d = tip.netWorth - startV;
                      if (active === 0 || Math.abs(d) < 1) return null;
                      const u = d >= 0;
                      return (
                        <span className={`text-[11px] ${u ? "text-blue" : "text-coral"}`}>
                          {u ? "▲" : "▼"}{" "}
                          {formatMoney(d, currency, { sign: true, cents: false })}
                        </span>
                      );
                    })()}
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
                  {((tip.income ?? 0) > 0 || (tip.spending ?? 0) > 0) && (
                    <div className="mt-1.5 flex items-center gap-3 border-t hairline pt-1.5 text-[11px]">
                      <span className="tnum text-blue">
                        +{formatMoney(tip.income ?? 0, currency, { cents: false })}
                        <span className="ml-1 text-muted">in</span>
                      </span>
                      <span className="tnum text-coral">
                        −{formatMoney(tip.spending ?? 0, currency, { cents: false })}
                        <span className="ml-1 text-muted">out</span>
                      </span>
                      {cadence !== "day" && (
                        <span className="ml-auto text-muted">{cadence}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
