"use client";

import { detailHref, type DetailQuery } from "@/lib/details";
import { useSearchParams } from "next/navigation";
import { MonthComposition } from "@/lib/analytics";
import { formatMonth } from "@/lib/format";
import { TimeSeriesChart } from "./TimeSeriesChart";

export function CompositionBars({ data, currency = "USD", highlight, metric = "spending" }: {
  metric?: "spending" | "income";
  data: MonthComposition[];
  currency?: string;
  highlight?: string;
  showTotals?: boolean;
}) {
  const params = useSearchParams();
  const queryFor = (month: string, key?: string): DetailQuery => ({ metric: key === "Studio rent support" && metric === "income" ? "support" : metric, months: [month], ...(metric === "spending" ? { category: key, rent: params.get("rent") === "exclude" ? "exclude" as const : undefined } : { source: key === "Studio rent support" ? undefined : key ?? params.get("src") ?? undefined, support: !key && params.get("support") === "include" ? "include" as const : undefined }) });
  const segments = [...new Map(data.flatMap((d) => d.segments.map((s) => [s.category, s] as const))).values()];
  return <TimeSeriesChart title="Monthly breakdown" currency={currency} kind="stacked" highlight={highlight ? formatMonth(highlight) : undefined}
    series={segments.map((s) => ({ key: s.category, label: s.label, color: s.color }))}
    data={data.map((d) => {
      const next = new URLSearchParams(params.toString());
      next.set("month", d.month);
      next.delete("scope");
      const amounts = new Map(d.segments.map((s) => [s.category, s.total]));
      return { id: d.month, label: formatMonth(d.month), detailHref: detailHref(queryFor(d.month)), valueHrefs: Object.fromEntries(segments.map((s) => [s.category, detailHref(queryFor(d.month, s.category))])), values: Object.fromEntries(segments.map((s) => [s.category, d.hasActivity === false ? null : amounts.get(s.category) ?? 0])) };
    })}
    table={{ columns: [
      { key: "coverage", label: "Coverage" },
      { key: "month", label: "Month", format: "month" },
      { key: "total", label: "Net total", format: "money", total: true },
      { key: "count", label: "Entries", format: "number", total: true },
      ...segments.map((s) => ({ key: s.category, label: s.label, format: "money" as const, total: true })),
    ], rows: data.map((d) => {
      const next = new URLSearchParams(params.toString()); next.set("month", d.month); next.delete("scope");
      return { id: d.month, href: detailHref(queryFor(d.month)), linkLabel: "Inspect month", cellHrefs: { total: detailHref(queryFor(d.month)), count: detailHref(queryFor(d.month)), ...Object.fromEntries(segments.map((s) => [s.category, detailHref(queryFor(d.month, s.category))])) }, values: {
        month: d.month, coverage: d.hasActivity === false ? "No recorded activity; coverage unknown" : "Recorded activity; may be partial", total: d.hasActivity === false ? null : d.total, count: d.segments.reduce((sum, s) => sum + s.count, 0),
        ...Object.fromEntries(segments.map((s) => [s.category, d.hasActivity === false ? null : d.segments.find((part) => part.category === s.category)?.total ?? 0])),
      } };
    }) }} />;
}
