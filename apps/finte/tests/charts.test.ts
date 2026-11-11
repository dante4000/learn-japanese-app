import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { CompositionBars } from "../src/components/charts/CompositionBars";
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


test("income chart totals retain studio support without an explicit URL option", () => {
  const data = [{ month: "2026-10", total: 3600, segments: [
    { category: "RARELIQUID", label: "RARELIQUID", color: "#2563eb", glyph: "", total: 2000, count: 1 },
    { category: "Studio rent support", label: "Studio rent support", color: "#a5b4fc", glyph: "", total: 1600, count: 0 },
  ] }];
  for (const includeSupport of [true, false]) {
    const html = renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router },
      createElement(SearchParamsContext.Provider, { value: new URLSearchParams("src=RARELIQUID") },
        createElement(CompositionBars, { metric: "income", data, includeSupport }))));
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((match) => new URL(match[1].replaceAll("&amp;", "&"), "http://localhost"));
    const total = links.find((url) => url.searchParams.get("metric") === "income");
    assert.ok(total);
    assert.equal(total.searchParams.get("support"), includeSupport ? "include" : null);
    assert.equal(total.searchParams.get("source"), "RARELIQUID");
    assert.equal(total.searchParams.get("months"), "2026-10");
    assert.ok(links.some((url) => url.searchParams.get("metric") === "support"));
  }
});
