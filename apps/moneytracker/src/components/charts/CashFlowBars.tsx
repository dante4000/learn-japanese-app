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
    <div className="flex h-44 items-end justify-between gap-3">
      {data.map((d) => (
        <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-36 w-full items-end justify-center gap-1">
            <div
              className="w-1/2 max-w-5 rounded-t-sm transition-all"
              style={{
                height: `${(d.income / max) * 100}%`,
                background:
                  "linear-gradient(180deg, var(--color-emerald), var(--color-emerald-deep))",
              }}
              title={`${formatMonth(d.month)} income: ${formatMoney(d.income, currency)}`}
            />
            <div
              className="w-1/2 max-w-5 rounded-t-sm transition-all"
              style={{
                height: `${(d.spending / max) * 100}%`,
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
  );
}
