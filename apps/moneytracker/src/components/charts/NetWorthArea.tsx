import { NetWorthSnapshot } from "@/lib/types";
import { formatMoney, formatDate } from "@/lib/format";

/** Smooth-ish area line of net worth over time. */
export function NetWorthArea({
  snapshots,
  currency = "USD",
  width = 720,
  height = 160,
}: {
  snapshots: NetWorthSnapshot[];
  currency?: string;
  width?: number;
  height?: number;
}) {
  if (snapshots.length < 2) {
    return (
      <div className="grid h-40 place-items-center text-sm text-muted">
        Net worth trend appears once you have a few days of history.
      </div>
    );
  }
  const pad = 8;
  const values = snapshots.map((s) => s.netWorth);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (snapshots.length - 1);
  const y = (v: number) =>
    pad + (1 - (v - min) / range) * (height - pad * 2);
  const pts = snapshots.map((s, i) => [pad + i * stepX, y(s.netWorth)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${height - pad} L${pts[0][0]},${height - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="none"
      style={{ height }}
    >
      <defs>
        <linearGradient id="nwfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-emerald)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-emerald)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#nwfill)" />
      <path
        d={line}
        fill="none"
        stroke="var(--color-emerald)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={2.5} fill="var(--color-emerald)">
          <title>
            {formatDate(snapshots[i].date)}:{" "}
            {formatMoney(snapshots[i].netWorth, currency)}
          </title>
        </circle>
      ))}
    </svg>
  );
}
