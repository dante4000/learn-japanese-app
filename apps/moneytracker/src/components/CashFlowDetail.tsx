import { CashFlowTable } from "./CashFlowTable";
import { CashFlowBars } from "./charts/CashFlowBars";
import { CashFlowDetailSummary } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";

/** Monthly income, spending, and savings share one reporting window. */
export function CashFlowDetail({
  summary,
  currency = "USD",
}: {
  summary: CashFlowDetailSummary;
  currency?: string;
}) {
  const { rows, avgIncome, avgSpending, avgNet, savingsRate } = summary;
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
      <div className="mb-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.l} className="rounded-xl border hairline bg-surface px-3 py-2.5">
            <div className="label-eyebrow">{t.l}</div>
            <div className={`tnum mt-1 break-words text-lg ${t.c}`}>{t.v}</div>
          </div>
        ))}
      </div>

      <CashFlowBars data={rows} currency={currency} showTable={false} />

      <div className="mt-6"><CashFlowTable rows={rows} currency={currency} /></div>

    </div>
  );
}
