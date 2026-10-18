import { WeekdaySpend } from "@/lib/insights";
import { TimeSeriesChart } from "./TimeSeriesChart";

export function WeekdayBars({ data, currency = "USD" }: { data: WeekdaySpend[]; currency?: string }) {
  const total = data.reduce((sum, d) => sum + d.total, 0);
  return <TimeSeriesChart title="Spending by weekday" currency={currency}
    data={data.map((d) => ({ id: d.weekday, label: d.weekday, values: { spending: d.total } }))}
    series={[{ key: "spending", label: "Net spending", color: "var(--color-coral)" }]}
    table={{ columns: [
      { key: "weekday", label: "Weekday" },
      { key: "total", label: "Net spending", format: "money", total: true },
      { key: "count", label: "Purchases", format: "number", total: true },
      { key: "share", label: "Net spending share", format: "percent" },
      { key: "average", label: "Net / purchase", format: "money", description: "Net spending after refunds divided by purchase count." },
    ], rows: data.map((d, i) => ({ id: d.weekday, sortValues: { weekday: i }, values: {
      weekday: d.weekday, total: d.total, count: d.count,
      share: total > 0 ? d.total / total * 100 : null,
      average: d.count > 0 ? d.total / d.count : null,
    } })) }} />;
}
