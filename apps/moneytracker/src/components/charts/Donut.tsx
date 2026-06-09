import { formatMoney } from "@/lib/format";

interface Slice {
  label: string;
  value: number;
  color: string;
}

/** Pure-SVG donut. The center shows the total; slices carry native tooltips. */
export function Donut({
  slices,
  total,
  currency = "USD",
  size = 200,
}: {
  slices: Slice[];
  total: number;
  currency?: string;
  size?: number;
}) {
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sum = slices.reduce((a, s) => a + s.value, 0) || 1;

  // Precompute each arc's length + cumulative offset purely (no mutation during
  // render). n is tiny (≤17 categories), so prefix-sum via slice is fine.
  const lens = slices.map((s) => (s.value / sum) * c);
  const segments = slices.map((s, i) => ({
    ...s,
    frac: s.value / sum,
    len: lens[i],
    offset: lens.slice(0, i).reduce((a, b) => a + b, 0),
  }));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
        />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${s.len} ${c - s.len}`}
            strokeDashoffset={-s.offset}
            strokeLinecap="butt"
          >
            <title>
              {s.label}: {formatMoney(s.value, currency)} (
              {Math.round(s.frac * 100)}%)
            </title>
          </circle>
        ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="label-eyebrow">Spent</div>
          <div className="tnum text-2xl text-cream">
            {formatMoney(total, currency, { cents: false })}
          </div>
        </div>
      </div>
    </div>
  );
}
