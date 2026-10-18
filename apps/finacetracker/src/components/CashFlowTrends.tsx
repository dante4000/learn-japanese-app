import { detailHref } from "@/lib/details";
import { cashFlowColumns, cashFlowTableRows } from "./CashFlowTable";
import { MonthCashFlow } from "@/lib/analytics";
import { formatMonth } from "@/lib/format";
import { SectionCard } from "./ui";
import { TimeSeriesChart } from "./charts/TimeSeriesChart";

export function CashFlowTrends({ rows, currency }: { rows: MonthCashFlow[]; currency: string }) {
  if (!rows.length) return null;
  const data = rows.map((r) => ({ id: r.month, label: formatMonth(r.month), detailHref: detailHref({ metric: "net", months: [r.month] }), valueHrefs: Object.fromEntries((["income", "spending", "net", "rate"] as const).map((metric) => [metric, detailHref({ metric, months: [r.month] })])), values: { net: r.hasActivity === false ? null : r.net, rate: r.income > 0 ? r.net / r.income * 100 : null } }));
  const table = { columns: cashFlowColumns, rows: cashFlowTableRows(rows) };
  return <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
    <SectionCard title="Monthly surplus or shortfall">
      <p className="mb-5 text-sm text-muted">Income minus spending. Below zero means spending exceeded income. Other deposits and transfers are excluded. Gaps mean no recorded activity; bank coverage is unknown.</p>
      <TimeSeriesChart title="Monthly surplus or shortfall" data={data} currency={currency} table={table} series={[{ key: "net", label: "Net", color: "var(--color-blue)" }]} />
    </SectionCard>
    <SectionCard title="Savings rate over time">
      <p className="mb-5 text-sm text-muted">The share of income left after spending. Months with no income have no rate. The latest month may be incomplete.</p>
      <TimeSeriesChart title="Savings rate over time" data={data} currency={currency} table={table} kind="line" unit="percent" series={[{ key: "rate", label: "Savings rate", color: "var(--color-blue)" }]} />
    </SectionCard>
  </div>;
}
