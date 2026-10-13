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
    <div>
    <div aria-hidden="true" className="flex h-40 items-end justify-between gap-1 sm:gap-3">
      {data.map((d) => (
        <div key={d.weekday} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end justify-center">
            <div
              className="w-full max-w-8 rounded-t-sm transition-[height] motion-reduce:transition-none"
              style={{
                height: `${(Math.max(0, d.total) / max) * 100}%`,
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
      <details className="mt-3 text-xs text-muted">
        <summary className="cursor-pointer">View weekday spending data</summary>
        <div className="mt-2 overflow-x-auto"><table className="w-full text-left">
          <thead><tr><th scope="col" className="px-2 py-1">Weekday</th><th scope="col" className="px-2 py-1">Spending</th><th scope="col" className="px-2 py-1">Transactions</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.weekday}><th scope="row" className="px-2 py-1 font-normal">{d.weekday}</th><td className="tnum whitespace-nowrap px-2 py-1">{formatMoney(d.total, currency)}</td><td className="tnum px-2 py-1">{d.count}</td></tr>)}</tbody>
        </table></div>
      </details>
    </div>
  );
}
