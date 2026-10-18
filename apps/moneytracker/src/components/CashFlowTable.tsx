import { MonthCashFlow } from "@/lib/analytics";
import { DataTable, type DataColumn, type DataRow } from "./DataTable";

export const cashFlowColumns: DataColumn[] = [
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
    const previousNet = previous?.month === previousDate.toISOString().slice(0, 7) ? previous.net : null;
    const change = previousNet == null ? null : row.net - previousNet;
    return { id: row.month, href: `/transactions?month=${row.month}`, values: {
      month: row.month, income: row.income, spending: row.spending, net: row.net,
      rate: row.income > 0 ? row.net / row.income * 100 : null,
      previousNet, change, changePct: previousNet && change != null ? change / Math.abs(previousNet) * 100 : null,
    } };
  });
}

export function CashFlowTable({ rows, currency }: { rows: MonthCashFlow[]; currency: string }) {
  return <DataTable title="Monthly cash flow" columns={cashFlowColumns} rows={cashFlowTableRows(rows)} currency={currency} defaultSort={{ key: "month", direction: "desc" }} />;
}
