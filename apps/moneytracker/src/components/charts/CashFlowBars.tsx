import { MonthCashFlow } from "@/lib/analytics";
import { formatMonth, formatMoney } from "@/lib/format";

/** Paired income/spending bars per month with native tooltips. */
export function CashFlowBars({
  data,
  currency = "USD",
}: {
  data: MonthCashFlow[];
  currency?: string;
}) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.income, d.spending)));
  return (
    <div>
    <div aria-hidden="true" className="flex h-44 overflow-x-auto items-end justify-between gap-1 sm:gap-3">
      {data.map((d) => (
        <div key={d.month} className="flex min-w-10 flex-1 flex-col items-center gap-2">
          <div className="flex h-36 w-full items-end justify-center gap-1">
            <div
              className="w-1/2 max-w-5 rounded-t-sm transition-[height] motion-reduce:transition-none"
              style={{
                height: `${(d.income / max) * 100}%`,
                background:
                  "linear-gradient(180deg, var(--color-blue), var(--color-blue-deep))",
              }}
              title={`${formatMonth(d.month)} income: ${formatMoney(d.income, currency)}`}
            />
            <div
              className="w-1/2 max-w-5 rounded-t-sm transition-[height] motion-reduce:transition-none"
              style={{
                height: `${(Math.max(0, d.spending) / max) * 100}%`,
                background:
                  "linear-gradient(180deg, var(--color-coral), var(--color-coral-deep))",
              }}
              title={`${formatMonth(d.month)} spending: ${formatMoney(d.spending, currency)}`}
            />
          </div>
          <span className="text-[0.62rem] uppercase tracking-wider text-faint">
            {formatMonth(d.month)}
          </span>
        </div>
      ))}
    </div>
      <details className="mt-3 text-xs text-muted">
        <summary className="cursor-pointer">View monthly cash flow data</summary>
        <div className="mt-2 overflow-x-auto"><table className="w-full text-left">
          <thead><tr><th scope="col" className="px-2 py-1">Month</th><th scope="col" className="px-2 py-1">Income</th><th scope="col" className="px-2 py-1">Spending</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.month}><th scope="row" className="whitespace-nowrap px-2 py-1 font-normal">{formatMonth(d.month)}</th><td className="tnum whitespace-nowrap px-2 py-1">{formatMoney(d.income, currency)}</td><td className="tnum whitespace-nowrap px-2 py-1">{formatMoney(d.spending, currency)}</td></tr>)}</tbody>
        </table></div>
      </details>
    </div>
  );
}
