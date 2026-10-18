import { detailHref } from "@/lib/details";
import { WeekdaySpend } from "@/lib/insights";
import { TimeSeriesChart } from "./TimeSeriesChart";

export function WeekdayBars({ data, currency = "USD", months }: { data: WeekdaySpend[]; currency?: string; months: string[] }) {
  const link = (weekday: string, statistic?: "share" | "average") => detailHref({ metric: "spending", months, statistic, weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday.slice(0, 3)) });
  const total = data.reduce((sum, d) => sum + d.total, 0);
  return <TimeSeriesChart title="Spending by weekday" currency={currency}
    data={data.map((d) => ({ id: d.weekday, label: d.weekday, detailHref: link(d.weekday), valueHrefs: { spending: link(d.weekday) }, values: { spending: d.total } }))}
    series={[{ key: "spending", label: "Net spending", color: "var(--color-coral)" }]}
    table={{ columns: [
      { key: "weekday", label: "Weekday" },
      { key: "total", label: "Net spending", format: "money", total: true },
      { key: "count", label: "Purchases", format: "number", total: true },
      { key: "share", label: "Net spending share", format: "percent" },
      { key: "average", label: "Net / purchase", format: "money", description: "Net spending after refunds divided by purchase count." },
    ], rows: data.map((d, i) => ({ id: d.weekday, sortValues: { weekday: i }, href: link(d.weekday), linkLabel: "Inspect weekday", cellHrefs: Object.fromEntries(["total", "count", "share", "average"].map((key) => [key, link(d.weekday, key === "share" ? "share" : key === "average" ? "average" : undefined)])), values: {
      weekday: d.weekday, total: d.total, count: d.count,
      share: total > 0 ? d.total / total * 100 : null,
      average: d.count > 0 ? d.total / d.count : null,
    } })) }} />;
}
