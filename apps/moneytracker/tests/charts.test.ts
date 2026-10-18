import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { TimeSeriesChart } from "../src/components/charts/TimeSeriesChart";

const router: AppRouterInstance = { bfcacheId: "chart-test", back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch() {} };
function render(props: Parameters<typeof TimeSeriesChart>[0]) {
  return renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router }, createElement(TimeSeriesChart, props)));
}
const series = [{ key: "amount", label: "Net spending", color: "#2563eb" }];

test("signed charts retain negative refunds and expose named keyboard controls and exact values", () => {
  const html = render({ title: "Daily spending", series, data: [{ label: "1", values: { amount: 200 } }, { label: "2", values: { amount: -50 } }] });
  assert.match(html, /<title[^>]*>Daily spending\. Select a period for exact values\.<\/title>/);
  assert.match(html, /role="button" tabindex="0" aria-label="2\. Net spending: −\$50\.00"/);
  assert.match(html, /<caption class="sr-only">Daily spending<\/caption>/);
  assert.doesNotMatch(html, /(?:NaN|Infinity|height="-)/);
});

test("empty, zero, and missing values never produce invalid chart geometry", () => {
  for (const data of [[], [{ label: "Jan", values: { amount: 0 } }], [{ label: "Jan", values: { amount: null } }]]) {
    const html = render({ title: "Savings rate", series, data, kind: "line", unit: "percent" });
    assert.doesNotMatch(html, /(?:NaN|Infinity|height="-)/);
    if (!data.length) assert.match(html, /No data for this period/);
    else if (data[0].values.amount === null) assert.match(html, /No data/);
  }
});

test("stacked charts retain refunds below zero and identify month drill-through links", () => {
  const html = render({ title: "Monthly breakdown", kind: "stacked", series: [...series, { key: "refund", label: "Refund", color: "#64748b" }], data: [{ label: "Oct 26", href: "?month=2026-10", values: { amount: 200, refund: -50 } }] });
  assert.match(html, /role="link" tabindex="0"/);
  assert.match(html, /\$150\.00 total/);
  assert.match(html, /Refund: −\$50\.00/);
  assert.doesNotMatch(html, /(?:NaN|Infinity|height="-)/);
});

test("six-month charts fit by default and include September and October labels", () => {
  const html = render({ title: "Monthly net", series, data: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((month, i) => ({ label: `${month} 26`, values: { amount: 1000 + i * 100 } })) });
  const svg = html.match(/<svg[^>]*>/)?.[0] ?? "";
  assert.doesNotMatch(svg, /min-width/, "fitted chart must not force horizontal overflow before hydration");
  assert.match(html, /All 6 periods visible/);
  assert.match(html, /<text[^>]*>Sep 26<\/text>/);
  assert.match(html, /<text[^>]*>Oct 26<\/text>/);
  assert.match(html, /Expand chart/);
  assert.match(html, /Explore detailed data/);
});

test("multi-year charts expose the full range and open with scroll controls", () => {
  const html = render({ title: "Full history", series, data: Array.from({ length: 60 }, (_, i) => ({ label: `${2021 + Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, "0")}`, values: { amount: i + 1 } })) });
  assert.match(html, /2021-01/);
  assert.match(html, /2025-12/);
  assert.match(html, /Explore detailed data · 60 rows/);
  assert.match(html, /min-width:3940px/);
  for (const control of ["Oldest", "Earlier", "Later", "Latest", "Fit all periods"]) assert.ok(html.includes(control));
  assert.doesNotMatch(html, /(?:NaN|Infinity|height="-)/);
});
