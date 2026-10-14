import test from "node:test";
import assert from "node:assert/strict";
import { EMPLOYER_HOUSING_SEGMENT, eligibleEmployerHousingSupport, employerHousingSupportTotal, parseEmployerHousingSupport, withEmployerHousingSupport } from "../src/lib/income-support";
import { incomeBreakdown, mergeIncomeMonths } from "../src/lib/insights";
import { emptyState, Transaction } from "../src/lib/types";

const support = { source: "RARELIQUID", amount: 1600, startMonth: "2021-10", endMonth: null };

test("support config requires a documented payer, positive amount, and valid months", () => {
  assert.deepEqual(parseEmployerHousingSupport({ ...support, source: "RareLiquid LLC" }), support);
  for (const invalid of [null, [], {}, { ...support, source: " " }, { ...support, amount: Infinity }, { ...support, amount: -1 }, { ...support, startMonth: "2021-13" }, { ...support, endMonth: "2021-09" }]) {
    assert.equal(parseEmployerHousingSupport(invalid), null);
  }
});

test("support counts only eligible calendar months, with an inclusive end", () => {
  assert.equal(employerHousingSupportTotal({ ...support, startMonth: "2026-02", endMonth: "2026-03" }, ["2026-01", "2026-02", "2026-03", "2026-04"]), 3200);
  assert.equal(employerHousingSupportTotal(support, ["2021-09"]), 0);
  assert.equal(employerHousingSupportTotal(undefined, ["2026-01"]), 0);
});

test("ongoing support sums an explicit period and does not duplicate repeated months", () => {
  assert.equal(employerHousingSupportTotal(support, ["2026-01", "2026-02", "2026-02"]), 3200);
  assert.equal(employerHousingSupportTotal(support, Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}`)), 19200);
});

test("saved support never adds bank deposits or changes recorded income", () => {
  const state = emptyState();
  state.employerHousingSupport = support;
  const deposit: Transaction = { id: "salary", accountId: "checking", amount: -2000, currency: "USD", date: "2026-03-01", name: "RareLiquid LLC", merchantName: null, pending: false, categoryPrimary: "INCOME", categoryDetailed: null, paymentChannel: null, source: "plaid", userCategory: null, note: null, hidden: false };
  state.transactions = [deposit];
  const recorded = mergeIncomeMonths(incomeBreakdown(state).byMonth);
  assert.equal(recorded.total, 2000);
  assert.equal(recorded.segments[0].count, 1);
  assert.equal(state.transactions.length, 1);
  assert.equal(recorded.total + employerHousingSupportTotal(support, ["2026-03"]), 3600);
});

test("support appears under all sources, its exact payer, or the support-only view", () => {
  assert.equal(eligibleEmployerHousingSupport(support, "", false), support);
  assert.equal(eligibleEmployerHousingSupport(support, "RARELIQUID LLC PAYROLL", false), support);
  assert.equal(eligibleEmployerHousingSupport(support, "__employer_housing__", false), support);
  assert.equal(eligibleEmployerHousingSupport(support, "ACME", false), null);
  assert.equal(eligibleEmployerHousingSupport(support, "RARELIQUID LLC CONSULTING", false), null);
  assert.equal(eligibleEmployerHousingSupport(support, "", true), null);
});

test("a dedicated support-only view has support and no deposit records", () => {
  const state = emptyState();
  const visible = eligibleEmployerHousingSupport(support, "__employer_housing__", false);
  const recorded = mergeIncomeMonths(incomeBreakdown(state).byMonth);
  assert.equal(recorded.total, 0);
  assert.deepEqual(recorded.segments, []);
  assert.equal(employerHousingSupportTotal(visible, ["2026-03"]), 1600);
  assert.equal(state.transactions.length, 0);
});

test("chart toggle stacks support only onto eligible months without adding deposits", () => {
  const bounded = { ...support, startMonth: "2026-02", endMonth: "2026-03" };
  const months = ["2026-01", "2026-02", "2026-03", "2026-04"].map((month) => ({ month, total: 2000, segments: [{ name: "RARELIQUID", total: 2000, color: "#2563eb", count: 1 }] }));
  const chart = withEmployerHousingSupport(months, bounded);
  assert.deepEqual(chart.map((m) => m.total), [2000, 3600, 3600, 2000]);
  assert.deepEqual(chart[1].segments.map((s) => s.name), ["RARELIQUID", EMPLOYER_HOUSING_SEGMENT]);
  assert.equal(chart[0], months[0]);
  const merged = mergeIncomeMonths(chart);
  assert.equal(merged.total, 11200);
  assert.equal(merged.segments.reduce((sum, s) => sum + s.count, 0), 4);
  assert.equal(months[1].total, 2000);
  assert.deepEqual(withEmployerHousingSupport(months, null), months);
});
