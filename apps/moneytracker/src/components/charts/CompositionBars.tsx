"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MonthComposition } from "@/lib/analytics";
import { formatMonth, formatMoney } from "@/lib/format";

/**
 * Stacked vertical bars — one per month, each split into category segments.
 * Shows how spending is distributed across categories and how that mix shifts
 * over time (your "habits"). Native tooltips per segment. Each bar links to
 * ?month=… so clicking it re-renders the page for that month (same mechanism
 * as the MonthPicker).
 */
export function CompositionBars({
  data,
  currency = "USD",
  highlight,
  showTotals = false,
}: {
  data: MonthComposition[];
  currency?: string;
  highlight?: string; // month to emphasize
  showTotals?: boolean; // render each month's total above its bar
}) {
  const params = useSearchParams();
  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <div className="overflow-x-auto pb-1">
    <div className="flex justify-between gap-2" style={{ minWidth: data.length * 52 }}>
      {data.map((d) => {
        const isHi = highlight === d.month;
        const next = new URLSearchParams(params.toString());
        next.set("month", d.month);
        // Selecting a month leaves the Income page's aggregate period.
        next.delete("scope");
        return (
          <Link
            key={d.month}
            href={`?${next.toString()}`}
            scroll={false}
            aria-label={`Show ${formatMonth(d.month)}: ${formatMoney(d.total, currency, { cents: false })}. ${d.segments.map((s) => `${s.label}: ${formatMoney(s.total, currency)}`).join("; ")}`}
            aria-current={isHi ? "true" : undefined}
            className="group flex flex-1 flex-col items-center gap-2"
          >
            {showTotals && (
              <span
                className={`tnum text-[0.6rem] font-medium tabular-nums transition-colors group-hover:text-blue ${
                  isHi ? "text-blue" : "text-cream-dim"
                }`}
              >
                {formatMoney(d.total, currency, { cents: false })}
              </span>
            )}
            {/* Fixed-height track so the bar's percentage height resolves. */}
            <div className="flex h-44 w-full items-end justify-center">
              <div
                className="flex w-full max-w-9 flex-col-reverse overflow-hidden rounded-md transition-opacity group-hover:opacity-100"
                style={{
                  height: `${(d.total / max) * 100}%`,
                  minHeight: d.total > 0 ? 6 : 0,
                  opacity: highlight && !isHi ? 0.55 : 1,
                  outline: isHi ? "2px solid var(--color-blue)" : "none",
                  outlineOffset: 2,
                }}
              >
                {d.segments.map((s) => (
                  <div
                    key={s.category}
                    style={{
                      // Guard the divisor: a zero-total month with segments would
                      // otherwise compute 0/0 = NaN% (an invalid, dropped style).
                      height: `${d.total > 0 ? (s.total / d.total) * 100 : 0}%`,
                      background: s.color,
                    }}
                    title={`${formatMonth(d.month)} · ${s.label}: ${formatMoney(s.total, currency)}`}
                  />
                ))}
              </div>
            </div>
            <span
              className={`text-[0.6rem] uppercase tracking-wider transition-colors group-hover:text-blue ${
                isHi ? "text-blue" : "text-faint"
              }`}
            >
              {formatMonth(d.month)}
            </span>
          </Link>
        );
      })}
    </div>
    </div>
  );
}
