import test from "node:test";
import assert from "node:assert/strict";
import { injectBaselines, isSyntheticBaseline } from "../src/lib/analytics";
import { emptyState, RecurringBaseline, Transaction } from "../src/lib/types";

const baseline: RecurringBaseline = {
  id: "rent", name: "Rent", category: "RENT_AND_UTILITIES",
  amount: 1000, startMonth: "2026-01",
};
function estimates(baselines: RecurringBaseline[], end = "2026-06") {
  const state = emptyState();
  state.baselines = baselines;
  state.transactions = ["2026-01", end].map((month, i): Transaction => ({
    id: `activity-${i}`, accountId: "checking", date: `${month}-15`, amount: 20,
    currency: "USD", name: "Coffee", merchantName: null, pending: false,
    categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: null, paymentChannel: null,
    source: "csv", userCategory: null, hidden: false, note: null,
  }));
  return injectBaselines(state).transactions.filter(isSyntheticBaseline).sort((a, b) => a.date.localeCompare(b.date));
}

test("end month is inclusive and later months have no estimate", () => {
  const rows = estimates([{ ...baseline, endMonth: "2026-03" }]);
  assert.deepEqual(rows.map((t) => t.date), ["2026-01-01", "2026-02-01", "2026-03-01"]);
});

test("an unspecified or cleared end month keeps the bill ongoing", () => {
  assert.equal(estimates([baseline]).length, 6);
  assert.equal(estimates([{ ...baseline, endMonth: null }]).length, 6);
});

test("an ended newer revision does not revive a superseded older revision", () => {
  const rows = estimates([baseline, { ...baseline, id: "rent-revised", amount: 1200, startMonth: "2026-03", endMonth: "2026-04" }]);
  assert.deepEqual(rows.map((t) => [t.date, t.amount]), [
    ["2026-01-01", 1000], ["2026-02-01", 1000],
    ["2026-03-01", 1200], ["2026-04-01", 1200],
  ]);
});

test("overlapping revisions use the newest start month and preserve IDs", () => {
  const rows = estimates([
    { ...baseline, endMonth: "2026-05" },
    { ...baseline, id: "rent-later", amount: 1500, startMonth: "2026-04", endMonth: "2026-06" },
  ]);
  assert.equal(rows.length, 6);
  assert.equal(rows.find((t) => t.date === "2026-04-01")?.amount, 1500);
  assert.equal(rows.find((t) => t.date === "2026-04-01")?.id, "baseline_rent-later_2026-04");
});

test("a later revision starts after an ended revision without filling the gap", () => {
  const rows = estimates([
    { ...baseline, endMonth: "2026-02" },
    { ...baseline, id: "new-term", startMonth: "2026-05", endMonth: "2026-05" },
  ]);
  assert.deepEqual(rows.map((t) => t.date), ["2026-01-01", "2026-02-01", "2026-05-01"]);
});

test("ending one bill does not stop a different bill in the same category", () => {
  const rows = estimates([
    { ...baseline, endMonth: "2026-02" },
    { ...baseline, id: "parking", name: "Parking", amount: 100 },
  ]);
  assert.equal(rows.filter((t) => t.merchantName === "Rent").length, 2);
  assert.equal(rows.filter((t) => t.merchantName === "Parking").length, 6);
});

test("the latest saved revision wins when start months are equal", () => {
  const rows = estimates([
    baseline,
    { ...baseline, id: "same-start", amount: 1300, endMonth: "2026-02" },
  ]);
  assert.deepEqual(rows.map((t) => [t.date, t.amount]), [["2026-01-01", 1300], ["2026-02-01", 1300]]);
});
