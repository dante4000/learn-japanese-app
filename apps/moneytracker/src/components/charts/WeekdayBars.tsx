import { WeekdaySpend } from "@/lib/insights";
import { formatMoney } from "@/lib/format";

/** Total spending per day of week — 7 bars in the house chart style. */
export function WeekdayBars({
  data,
  currency = "USD",
}: {
  data: WeekdaySpend[];
  currency?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="flex h-40 items-end justify-between gap-3">
      {data.map((d) => (
        <div key={d.weekday} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end justify-center">
            <div
              className="w-full max-w-8 rounded-t-sm transition-all"
              style={{
                height: `${(d.total / max) * 100}%`,
                background:
                  "linear-gradient(180deg, var(--color-coral), var(--color-coral-deep))",
              }}
              title={`${d.weekday}: ${formatMoney(d.total, currency)} · ${d.count}×`}
            />
          </div>
          <span className="text-[0.62rem] uppercase tracking-wider text-faint">
            {d.weekday}
          </span>
        </div>
      ))}
    </div>
  );
}
