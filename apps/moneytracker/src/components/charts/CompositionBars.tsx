"use client";

import { useSearchParams } from "next/navigation";
import { MonthComposition } from "@/lib/analytics";
import { formatMonth } from "@/lib/format";
import { TimeSeriesChart } from "./TimeSeriesChart";

export function CompositionBars({ data, currency = "USD", highlight }: {
  data: MonthComposition[];
  currency?: string;
  highlight?: string;
  showTotals?: boolean;
}) {
  const params = useSearchParams();
  const segments = [...new Map(data.flatMap((d) => d.segments.map((s) => [s.category, s] as const))).values()];
  return <TimeSeriesChart title="Monthly breakdown" currency={currency} kind="stacked" highlight={highlight ? formatMonth(highlight) : undefined}
    series={segments.map((s) => ({ key: s.category, label: s.label, color: s.color }))}
    data={data.map((d) => {
      const next = new URLSearchParams(params.toString());
      next.set("month", d.month);
      next.delete("scope");
      const amounts = new Map(d.segments.map((s) => [s.category, s.total]));
      return { id: d.month, label: formatMonth(d.month), href: `?${next.toString()}`, values: Object.fromEntries(segments.map((s) => [s.category, amounts.get(s.category) ?? 0])) };
    })}
    table={{ columns: [
      { key: "month", label: "Month", format: "month" },
      { key: "total", label: "Net total", format: "money", total: true },
      { key: "count", label: "Entries", format: "number", total: true },
      ...segments.map((s) => ({ key: s.category, label: s.label, format: "money" as const, total: true })),
    ], rows: data.map((d) => {
      const next = new URLSearchParams(params.toString()); next.set("month", d.month); next.delete("scope");
      return { id: d.month, href: `?${next.toString()}`, linkLabel: "Open month", values: {
        month: d.month, total: d.total, count: d.segments.reduce((sum, s) => sum + s.count, 0),
        ...Object.fromEntries(segments.map((s) => [s.category, d.segments.find((part) => part.category === s.category)?.total ?? 0])),
      } };
    }) }} />;
}
