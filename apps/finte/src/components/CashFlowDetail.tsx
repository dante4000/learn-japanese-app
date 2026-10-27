import { DetailLink } from "@/components/DetailPanel";
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
      <p className="mb-4 text-sm text-muted">Averages use {rows.filter((r) => r.hasActivity !== false).length} months with recorded activity. Empty calendar months have unknown coverage and are excluded from the average. The first and latest months may be partial.</p>
      <div className="mb-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <div key={t.l} className="rounded-xl border hairline bg-surface px-3 py-2.5">
            <div className="label-eyebrow">{t.l}</div>
            <div className={`tnum mt-1 break-words text-lg ${t.c}`}><DetailLink query={{ metric: (["income", "spending", "net", "rate"] as const)[i], months: rows.filter((r) => r.hasActivity !== false).map((r) => r.month), statistic: i < 3 ? "monthly" : undefined }}>{t.v}</DetailLink></div>
          </div>
        ))}
      </div>

      <CashFlowBars data={rows} currency={currency} showTable={false} />

      <div className="mt-6"><CashFlowTable rows={rows} currency={currency} /></div>

    </div>
  );
}
