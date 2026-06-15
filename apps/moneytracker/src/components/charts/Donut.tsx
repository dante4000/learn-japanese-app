"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/format";

interface Slice {
  label: string;
  value: number;
  color: string;
  key?: string; // category key, enables click-through when hrefBase is set
}

/**
 * Interactive donut. Hover a slice to highlight it and see its share in the
 * center; click (when hrefBase is set) to drill into that category's
 * transactions.
 */
export function Donut({
  slices,
  total,
  currency = "USD",
  size = 200,
  hrefBase,
  month,
  centerLabel = "Spent",
}: {
  slices: Slice[];
  total: number;
  currency?: string;
  size?: number;
  hrefBase?: string; // e.g. "/transactions" → /transactions?category=KEY
  month?: string; // yyyy-mm — appended so the drill-through keeps month context
  centerLabel?: string; // center caption under the total (e.g. "Earned")
}) {
  const router = useRouter();
  const [hover, setHover] = useState<number | null>(null);
  const stroke = 22;
  const r = (size - stroke - 6) / 2;
  const c = 2 * Math.PI * r;
  const sum = slices.reduce((a, s) => a + s.value, 0) || 1;

  const lens = slices.map((s) => (s.value / sum) * c);
  const segments = slices.map((s, i) => ({
    ...s,
    frac: s.value / sum,
    len: lens[i],
    offset: lens.slice(0, i).reduce((a, b) => a + b, 0),
  }));

  const active = hover != null ? segments[hover] : null;
  const clickable = (s: Slice) => Boolean(hrefBase && s.key);
  const go = (s: Slice) => {
    if (hrefBase && s.key) {
      const monthParam = month ? `&month=${encodeURIComponent(month)}` : "";
      router.push(`${hrefBase}?category=${encodeURIComponent(s.key)}${monthParam}`);
    }
  };

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
        {segments.map((s, i) => {
          const isHover = hover === i;
          const canClick = clickable(s);
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={isHover ? stroke + 6 : stroke}
              strokeDasharray={`${s.len} ${c - s.len}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
              opacity={hover == null || isHover ? 1 : 0.35}
              style={{
                cursor: canClick ? "pointer" : "default",
                transition: "opacity .15s ease, stroke-width .15s ease",
              }}
              // Keyboard-accessible drill-through: focusable slices behave like
              // buttons (Enter/Space navigate), and focus mirrors hover so the
              // center readout updates for keyboard users too.
              tabIndex={canClick ? 0 : undefined}
              role={canClick ? "button" : undefined}
              aria-label={
                canClick
                  ? `${s.label}: ${formatMoney(s.value, currency, { cents: false })}, ${Math.round(s.frac * 100)}% — view transactions`
                  : undefined
              }
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => go(s)}
              onKeyDown={(e) => {
                if (canClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  go(s);
                }
              }}
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        {active ? (
          <div className="px-6">
            <div className="truncate text-xs font-semibold" style={{ color: active.color }}>
              {active.label}
            </div>
            <div className="tnum text-xl text-cream">
              {formatMoney(active.value, currency, { cents: false })}
            </div>
            <div className="tnum text-[0.65rem] text-muted">
              {Math.round(active.frac * 100)}%
              {clickable(active) ? " · tap to view" : ""}
            </div>
          </div>
        ) : (
          <div>
            <div className="label-eyebrow">{centerLabel}</div>
            <div className="tnum text-2xl text-cream">
              {formatMoney(total, currency, { cents: false })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
