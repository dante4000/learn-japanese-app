import { cashFlowColumns, cashFlowTableRows } from "../CashFlowTable";
import { MonthCashFlow } from "@/lib/analytics";
import { formatMonth } from "@/lib/format";
import { TimeSeriesChart } from "./TimeSeriesChart";

export function CashFlowBars({ data, currency = "USD", showTable = true }: { data: MonthCashFlow[]; currency?: string; showTable?: boolean }) {
  return <TimeSeriesChart title="Income and spending by month" currency={currency} showTable={showTable} table={{ columns: cashFlowColumns, rows: cashFlowTableRows(data) }}
    data={data.map((d) => ({ id: d.month, label: formatMonth(d.month), values: { income: d.income, spending: d.spending } }))}
    series={[{ key: "income", label: "Income", color: "var(--color-blue)" }, { key: "spending", label: "Spending", color: "var(--color-coral)" }]} />;
}
