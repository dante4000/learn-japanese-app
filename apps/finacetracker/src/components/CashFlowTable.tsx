import { detailHref } from "@/lib/details";
import { MonthCashFlow } from "@/lib/analytics";
import { DataTable, type DataColumn, type DataRow } from "./DataTable";

export const cashFlowColumns: DataColumn[] = [
  { key: "coverage", label: "Coverage" },
  { key: "month", label: "Month", format: "month" },
  { key: "income", label: "Income", format: "money", total: true },
  { key: "spending", label: "Net spending", format: "money", total: true, description: "Purchases minus refunds in their posting month." },
  { key: "net", label: "Surplus / shortfall", format: "money", total: true },
  { key: "rate", label: "Savings rate", format: "percent", description: "Surplus divided by income. No rate when income is zero." },
  { key: "previousNet", label: "Prior month net", format: "money" },
  { key: "change", label: "Net change", format: "money" },
  { key: "changePct", label: "Net change (%)", format: "percent" },
];

export function cashFlowTableRows(rows: MonthCashFlow[]): DataRow[] {
  return rows.map((row, i) => {
    const previous = rows[i - 1];
    const previousDate = new Date(`${row.month}-01T00:00:00Z`);
    previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);
    const previousNet = row.hasActivity !== false && previous?.hasActivity !== false && previous?.month === previousDate.toISOString().slice(0, 7) ? previous.net : null;
    const change = previousNet == null ? null : row.net - previousNet;
    const links = Object.fromEntries((["income", "spending", "net", "rate"] as const).map((metric) => [metric, detailHref({ metric, months: [row.month] })]));
    return { id: row.month, href: links.net, linkLabel: "Inspect cash flow", cellHrefs: { ...links, previousNet: detailHref({ metric: "net", months: [previousDate.toISOString().slice(0, 7)] }), change: detailHref({ metric: "net", months: [row.month], priorMonths: [previousDate.toISOString().slice(0, 7)] }), changePct: detailHref({ metric: "net", months: [row.month], priorMonths: [previousDate.toISOString().slice(0, 7)] }) }, values: {
      month: row.month, coverage: row.hasActivity === false ? "No recorded activity; coverage unknown" : "Recorded activity; may be partial", income: row.hasActivity === false ? null : row.income, spending: row.hasActivity === false ? null : row.spending, net: row.hasActivity === false ? null : row.net,
      rate: row.income > 0 ? row.net / row.income * 100 : null,
      previousNet, change, changePct: previousNet && change != null ? change / Math.abs(previousNet) * 100 : null,
    } };
  });
}

export function CashFlowTable({ rows, currency }: { rows: MonthCashFlow[]; currency: string }) {
  return <DataTable title="Monthly cash flow" columns={cashFlowColumns} rows={cashFlowTableRows(rows)} currency={currency} defaultSort={{ key: "month", direction: "desc" }} />;
}
