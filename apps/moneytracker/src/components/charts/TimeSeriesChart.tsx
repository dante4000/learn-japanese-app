"use client";

import { useRouter } from "next/navigation";
import { useLoadingTransition } from "../LoadingFeedback";
import { useEffect, useId, useRef, useState } from "react";
import { DataTable, type DataColumn, type DataRow } from "../DataTable";
import { formatCompact, formatMoney } from "@/lib/format";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
}
export interface ChartPoint {
  id?: string;
  label: string;
  href?: string;
  values: Record<string, number | null>;
}

/** One scale and readout for signed bars and lines. Null values leave gaps. */
export function TimeSeriesChart({ data, series, title, currency = "USD", kind = "bar", unit = "money", highlight, table, showTable = true }: {
  data: ChartPoint[];
  series: ChartSeries[];
  title: string;
  currency?: string;
  kind?: "bar" | "line" | "stacked";
  highlight?: string;
  unit?: "money" | "percent";
  table?: { columns: DataColumn[]; rows: DataRow[] };
  showTable?: boolean;
}) {
  const id = useId();
  const router = useRouter();
  const [, startTransition] = useLoadingTransition("Loading selected month…");
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(600);
  const [expanded, setExpanded] = useState(false);
  const chartScroll = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const [selected, setSelected] = useState<number | null>(null);
  if (!data.length) return <div ref={containerRef}><p className="py-10 text-center text-sm text-muted">No data for this period.</p></div>;
  const highlighted = data.findIndex((d) => d.label === highlight);
  const active = Math.min(selected ?? (highlighted >= 0 ? highlighted : data.length - 1), data.length - 1);
  const values = data.flatMap((d) => series.flatMap((s) => d.values[s.key] == null ? [] : [d.values[s.key]!]));
  const low = Math.min(0, ...(kind === "stacked" ? data.map((d) => series.reduce((sum, s) => sum + Math.min(0, d.values[s.key] ?? 0), 0)) : values));
  const high = Math.max(0, ...(kind === "stacked" ? data.map((d) => series.reduce((sum, s) => sum + Math.max(0, d.values[s.key] ?? 0), 0)) : values));
  const rawStep = (high - low || (unit === "percent" ? 100 : 1000)) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].find((n) => n * magnitude >= rawStep)! * magnitude;
  const min = Math.floor(low / step) * step;
  const max = Math.max(min + step, Math.ceil(high / step) * step);
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => min + step * i);
  const width = Math.max(280, expanded ? Math.max(availableWidth, 100 + data.length * 64) : availableWidth);
  const height = 280;
  const left = 64, right = 16, top = 18;
  const angledLabels = data.length <= 12 && (width - left - right) / data.length < 48;
  const bottom = angledLabels ? 72 : 44;
  const plotWidth = width - left - right;
  const band = plotWidth / data.length;
  const x = (i: number) => left + band * (i + 0.5);
  const y = (v: number) => top + (max - v) / (max - min) * (height - top - bottom);
  const format = (v: number, compact = false) => unit === "percent" ? `${Math.round(v)}%` : compact ? formatCompact(v, currency) : formatMoney(v, currency);
  const labelEvery = data.length <= 12 ? 1 : Math.max(1, Math.ceil(data.length / Math.max(4, Math.floor(plotWidth / 35))));
  const choose = (index: number) => {
    setSelected(index);
    const href = data[index].href;
    if (href) startTransition(() => router.push(href, { scroll: false }));
  };
  const columns: DataColumn[] = table?.columns ?? [
    { key: "period", label: "Period" },
    ...series.map((s) => ({ key: s.key, label: s.label, format: unit, total: unit === "money" } as DataColumn)),
    ...(kind === "stacked" ? [{ key: "total", label: "Net total", format: unit, total: unit === "money" } as DataColumn] : []),
    ...(series.length === 1 ? [
      { key: "previous", label: "Previous period", format: unit } as DataColumn,
      { key: "change", label: unit === "percent" ? "Change (points)" : "Change", format: unit === "percent" ? "number" : "money" } as DataColumn,
      ...(unit === "money" ? [{ key: "changePct", label: "Change (%)", format: "percent" } as DataColumn] : []),
    ] : []),
  ];
  const tableRows: DataRow[] = table?.rows ?? data.map((point, i) => {
    const value = point.values[series[0]?.key];
    const previous = i > 0 ? data[i - 1].values[series[0]?.key] : null;
    const change = value != null && previous != null ? value - previous : null;
    return { id: point.id ?? String(i), href: point.href, linkLabel: "Open breakdown", sortValues: { period: i }, values: {
      ...point.values, period: point.label,
      total: series.reduce((sum, s) => sum + (point.values[s.key] ?? 0), 0),
      previous: previous ?? null, change,
      changePct: change != null && previous ? change / Math.abs(previous) * 100 : null,
    } };
  });
  return (
    <div ref={containerRef} className="min-w-0">
      <div className="mb-4 flex max-h-32 flex-wrap items-center gap-x-5 gap-y-2 overflow-y-auto text-sm">
        {series.map((s) => <span key={s.key} className="flex min-w-0 items-center gap-2 break-words text-cream-dim">
          <span aria-hidden="true" className="w-4 border-t-[3px]" style={{ borderColor: s.color, borderStyle: s.dashed ? "dashed" : "solid" }} />{s.label}
        </span>)}
      </div>
      <div aria-live="polite" aria-atomic="true" className={`mb-2 flex flex-wrap items-center gap-x-6 gap-y-2 overflow-y-auto rounded-xl bg-surface-2 px-4 py-3 text-sm ${series.length > 3 ? "h-40" : "min-h-16"}`}>
        <span className="font-semibold text-cream">{data[active].label}{kind === "stacked" && <span className="tnum ml-3">{format(series.reduce((sum, s) => sum + (data[active].values[s.key] ?? 0), 0))} total</span>}</span>
        {series.map((s) => <span key={s.key} className="min-w-0 break-words text-muted">{s.label} <strong className="tnum ml-1 font-medium text-cream">{data[active].values[s.key] == null ? "—" : format(data[active].values[s.key]!)}</strong></span>)}
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>{expanded ? "Expanded view" : `All ${data.length} periods visible`} · {data[0].label} – {data[data.length - 1].label}</span>
        <button type="button" aria-pressed={expanded} onClick={() => setExpanded((value) => !value)} className="min-h-11 rounded-lg border hairline px-3 text-sm text-cream hover:bg-surface-2">{expanded ? "Fit all periods" : "Expand chart"}</button>
      </div>
      {expanded && <div className="mb-2 flex justify-between gap-2">
        <button type="button" onClick={() => chartScroll.current?.scrollBy({ left: -availableWidth * 0.75 })} className="min-h-11 rounded-lg border hairline px-3 text-sm text-cream">← Scroll left</button>
        <button type="button" onClick={() => chartScroll.current?.scrollBy({ left: availableWidth * 0.75 })} className="min-h-11 rounded-lg border hairline px-3 text-sm text-cream">Scroll right →</button>
      </div>}
      <div ref={chartScroll} className="overflow-x-auto pb-1" role="region" aria-label={`${title} chart. ${expanded ? "Expanded. Scroll horizontally for all periods." : "All periods fit in the chart."}`} tabIndex={0} style={{ scrollbarWidth: "auto" }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block w-full" style={{ minWidth: expanded ? width : undefined, height }} role="group" aria-labelledby={id}>
          <title id={id}>{`${title}. Select a period for exact values.`}</title>
          {ticks.map((v) => <g key={v} aria-hidden="true">
            <line x1={left} x2={width - right} y1={y(v)} y2={y(v)} stroke={v === 0 ? "var(--color-line-2)" : "var(--color-line)"} strokeDasharray={v === 0 ? undefined : "3 5"} />
            <text x={left - 12} y={y(v)} dominantBaseline="middle" textAnchor="end" fontSize={12} fill="var(--color-muted)">{format(v, true)}</text>
          </g>)}
          {kind === "line" && series.map((s) => {
            let connected = false;
            const path = data.map((d, i) => {
              const v = d.values[s.key];
              if (v == null) { connected = false; return ""; }
              const segment = `${connected ? "L" : "M"}${x(i)},${y(v)}`;
              connected = true;
              return segment;
            }).join(" ");
            return <path key={s.key} d={path} fill="none" stroke={s.color} strokeWidth={2.5} strokeDasharray={s.dashed ? "6 4" : undefined} strokeLinejoin="round" aria-hidden="true" />;
          })}
          {data.map((d, i) => <g key={`${d.label}-${i}`} role={d.href ? "link" : "button"} tabIndex={0}
            aria-label={`${d.label}. ${series.map((s) => `${s.label}: ${d.values[s.key] == null ? "No data" : format(d.values[s.key]!)}`).join(". ")}`}
            aria-pressed={d.href ? undefined : active === i} onFocus={() => setSelected(i)} onPointerEnter={() => setSelected(i)} onClick={() => choose(i)}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(i); } }} className="cursor-pointer">
            <rect x={x(i) - band / 2} y={top} width={band} height={height - top - bottom} fill={active === i ? "var(--color-line)" : "transparent"} opacity={0.35} />
            {series.map((s, j) => {
              const v = d.values[s.key];
              if (v == null) return null;
              if (kind === "line") return <circle key={s.key} cx={x(i)} cy={y(v)} r={active === i ? 4.5 : data.length < 3 ? 3 : 0} fill={s.color} stroke="var(--color-surface)" strokeWidth={2} />;
              if (kind === "stacked") {
                const start = series.slice(0, j).reduce((sum, previous) => {
                  const value = d.values[previous.key] ?? 0;
                  return sum + (v >= 0 ? Math.max(0, value) : Math.min(0, value));
                }, 0);
                return <rect key={s.key} x={x(i) - Math.min(36, band * 0.65) / 2} y={Math.min(y(start), y(start + v))} width={Math.min(36, band * 0.65)} height={Math.abs(y(start) - y(start + v))} fill={s.color} />;
              }
              const barWidth = Math.min(24, band * 0.7 / series.length);
              return <rect key={s.key} x={x(i) - barWidth * series.length / 2 + j * barWidth + 1} y={Math.min(y(0), y(v))} width={barWidth - 2} height={Math.abs(y(v) - y(0))} rx={2} fill={s.color} />;
            })}
            {(i % labelEvery === 0 || i === data.length - 1) && <text x={x(i)} y={height - (angledLabels ? 48 : 13)} transform={angledLabels ? `rotate(-45 ${x(i)} ${height - 48})` : undefined} textAnchor={angledLabels ? "end" : "middle"} fill="var(--color-muted)" fontSize={12}>{d.label}</text>}
          </g>)}
        </svg>
      </div>
      <p className="mt-1 text-xs text-muted">{data.some((d) => d.href) ? "Select a month to open its breakdown." : "Select a point or a table row for exact values."}</p>
      {showTable && <details className="mt-4 text-sm text-muted">
        <summary className="w-fit cursor-pointer py-2 hover:text-cream">Explore detailed data · {tableRows.length} rows</summary>
        <div className="mt-3"><DataTable title={title} columns={columns} rows={tableRows} currency={currency} selectedId={data[active].id ?? String(active)} onSelectRow={(rowId) => {
          const index = data.findIndex((point, i) => (point.id ?? String(i)) === rowId);
          if (index >= 0) { setSelected(index); if (expanded && chartScroll.current) chartScroll.current.scrollLeft = x(index) - chartScroll.current.clientWidth / 2; }
        }} /></div>
      </details>}

    </div>
  );
}
