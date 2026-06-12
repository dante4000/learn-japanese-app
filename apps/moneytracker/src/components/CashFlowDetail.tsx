import { CashFlowDetailSummary } from "@/lib/analytics";
import { formatMoney, formatMonth } from "@/lib/format";

/**
 * Detailed cash flow: period summary tiles, a diverging income(up)/spending
 * (down) chart with the net underneath each month, and a month-by-month table
 * with savings rate.
 */
export function CashFlowDetail({
  summary,
  currency = "USD",
}: {
  summary: CashFlowDetailSummary;
  currency?: string;
}) {
  const { rows, avgIncome, avgSpending, avgNet, savingsRate } = summary;
  const max = Math.max(1, ...rows.map((r) => Math.max(r.income, r.spending)));
  const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);

  const tiles = [
    { l: "Avg income/mo", v: formatMoney(avgIncome, currency, { cents: false }), c: "text-blue" },
    { l: "Avg spending/mo", v: formatMoney(avgSpending, currency, { cents: false }), c: "text-coral" },
    {
      l: "Avg net/mo",
      v: formatMoney(avgNet, currency, { sign: true, cents: false }),
      c: avgNet >= 0 ? "text-blue" : "text-coral",
    },
    { l: "Savings rate", v: pct(savingsRate), c: (savingsRate ?? 0) >= 0 ? "text-blue" : "text-coral" },
  ];

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.l} className="rounded-xl border hairline bg-surface px-3 py-2.5">
            <div className="label-eyebrow">{t.l}</div>
            <div className={`tnum mt-1 text-lg ${t.c}`}>{t.v}</div>
          </div>
        ))}
      </div>

      {/* Diverging chart: income above the line, spending below, net under. */}
      <div className="flex items-stretch justify-between gap-1.5">
        {rows.map((r) => (
          <div key={r.month} className="flex flex-1 flex-col items-center">
            <div className="flex h-20 w-full items-end justify-center">
              <div
                className="w-3/5 max-w-6 rounded-t"
                style={{
                  height: `${(r.income / max) * 100}%`,
                  minHeight: r.income > 0 ? 3 : 0,
                  background:
                    "linear-gradient(180deg, var(--color-blue), var(--color-blue-deep))",
                }}
                title={`${formatMonth(r.month)} income: ${formatMoney(r.income, currency)}`}
              />
            </div>
            <div className="my-1 h-px w-full bg-[var(--color-line)]" />
            <div className="flex h-20 w-full items-start justify-center">
              <div
                className="w-3/5 max-w-6 rounded-b"
                style={{
                  height: `${(r.spending / max) * 100}%`,
                  minHeight: r.spending > 0 ? 3 : 0,
                  background:
                    "linear-gradient(180deg, var(--color-coral), var(--color-coral-deep))",
                }}
                title={`${formatMonth(r.month)} spending: ${formatMoney(r.spending, currency)}`}
              />
            </div>
            <div
              className={`tnum mt-2 text-[0.62rem] ${r.net >= 0 ? "text-blue" : "text-coral"}`}
            >
              {formatMoney(r.net, currency, { sign: true, cents: false })}
            </div>
            <div className="text-[0.58rem] uppercase tracking-wider text-faint">
              {formatMonth(r.month)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue" /> Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-coral" /> Spending
        </span>
        <span>Net = saved (＋) or overspent (−)</span>
      </div>

      {/* Month-by-month table */}
      <div className="mt-6 overflow-hidden rounded-xl border hairline">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_0.7fr] gap-2 bg-surface-2 px-4 py-2 text-[0.6rem] uppercase tracking-wider text-muted">
          <span>Month</span>
          <span className="text-right">Income</span>
          <span className="text-right">Spending</span>
          <span className="text-right">Net</span>
          <span className="text-right">Saved</span>
        </div>
        <div className="divide-y divide-[var(--color-line)]">
          {[...rows].reverse().map((r) => (
            <div
              key={r.month}
              className="grid grid-cols-[1.2fr_1fr_1fr_1fr_0.7fr] gap-2 px-4 py-2.5 text-sm"
            >
              <span className="text-cream-dim">{formatMonth(r.month)}</span>
              <span className="tnum text-right text-blue">
                {formatMoney(r.income, currency, { cents: false })}
              </span>
              <span className="tnum text-right text-coral">
                {formatMoney(r.spending, currency, { cents: false })}
              </span>
              <span
                className={`tnum text-right ${r.net >= 0 ? "text-cream" : "text-coral"}`}
              >
                {formatMoney(r.net, currency, { sign: true, cents: false })}
              </span>
              <span
                className={`tnum text-right text-xs ${(r.savingsRate ?? 0) >= 0 ? "text-muted" : "text-coral"}`}
              >
                {pct(r.savingsRate)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
