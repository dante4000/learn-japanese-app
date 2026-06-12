import Link from "next/link";
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
}: {
  data: MonthComposition[];
  currency?: string;
  highlight?: string; // month to emphasize
}) {
  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <div className="flex justify-between gap-2">
      {data.map((d) => {
        const isHi = highlight === d.month;
        return (
          <Link
            key={d.month}
            href={`?month=${d.month}`}
            scroll={false}
            aria-label={`Show ${formatMonth(d.month)}`}
            aria-current={isHi ? "true" : undefined}
            className="group flex flex-1 flex-col items-center gap-2"
          >
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
                      height: `${(s.total / d.total) * 100}%`,
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
  );
}
