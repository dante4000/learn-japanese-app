import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DataTable } from "../src/components/DataTable";
import { cashFlowTableRows } from "../src/components/CashFlowTable";
import { formatTableValue, queryTableRows, tableCsv, type DataColumn, type DataRow } from "../src/lib/table-data";

const columns: DataColumn[] = [{ key: "month", label: "Month", format: "month" }, { key: "amount", label: "Net", format: "money", total: true }];
const rows: DataRow[] = [
  { id: "sep", values: { month: "2026-09", amount: 10000.5 } },
  { id: "oct", values: { month: "2026-10", amount: -20.25 } },
  { id: "aug", values: { month: "2026-08", amount: 900 } },
  { id: "nov", values: { month: "2026-11", amount: null } },
];

test("table sorts amounts numerically, dates chronologically, and missing values last", () => {
  assert.deepEqual(queryTableRows(rows, columns, "", { key: "amount", direction: "asc" }).map((r) => r.id), ["oct", "aug", "sep", "nov"]);
  assert.deepEqual(queryTableRows(rows, columns, "", { key: "amount", direction: "desc" }).map((r) => r.id), ["sep", "aug", "oct", "nov"]);
  assert.deepEqual(queryTableRows(rows, columns, "", { key: "month", direction: "asc" }).map((r) => r.id), ["aug", "sep", "oct", "nov"]);
  assert.equal(rows[0].id, "sep", "source rows are not reordered");
});

test("search matches full month names, raw dates, and formatted exact values", () => {
  for (const query of ["September", "2026-09", "$10,000.50", "September 2026 10000.5"]) {
    assert.deepEqual(queryTableRows(rows, columns, query, null).map((r) => r.id), ["sep"], query);
  }
  assert.deepEqual(queryTableRows(rows, columns, "December", null), []);
  assert.equal(formatTableValue(null, columns[1]), "—");
});

test("CSV keeps numeric precision, quotes bank text, and neutralizes formulas", () => {
  const csv = tableCsv([{ id: "1", values: { name: '=HYPERLINK("bad")', amount: -20.25 } }, { id: "2", values: { name: 'Quoted, "name"\nnext line', amount: null } }], [{ key: "name", label: "Name" }, columns[1]]);
  assert.match(csv, /"'=HYPERLINK\(""bad""\)"/);
  assert.match(csv, /"-20.25"/);
  assert.match(csv, /"Quoted, ""name""\nnext line",""/);
});

test("cash-flow comparisons do not mistake a missing month for the prior month", () => {
  const data = cashFlowTableRows([
    { month: "2026-08", income: 100, spending: 200, net: -100 },
    { month: "2026-09", income: 200, spending: 100, net: 100 },
    { month: "2026-11", income: 0, spending: 40, net: -40 },
  ]);
  assert.equal(data[1].values.change, 200);
  assert.equal(data[1].values.changePct, 200);
  assert.equal(data[2].values.previousNet, null);
  assert.equal(data[2].values.rate, null);
  assert.equal(data[1].href, "/transactions?month=2026-09");
});

test("detailed tables expose accessible sorting, search, pagination, and scroll controls", () => {
  const html = renderToStaticMarkup(createElement(DataTable, { title: "Monthly net", columns, rows, defaultSort: { key: "month", direction: "asc" } }));
  assert.match(html, /Search this table/);
  assert.match(html, /Export CSV/);
  assert.match(html, /aria-sort="ascending"/);
  assert.match(html, /Monthly net\. Scroll for more rows and columns/);
  assert.match(html, /September 2026/);
  assert.match(html, /Filtered total/);
  assert.match(html, /\$10,880\.25/);
  assert.match(html, /Rows per page for Monthly net/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
