import test from "node:test";
import assert from "node:assert/strict";
import { emptyMeta, emptyState, type BillReminder, type SavingsGoal } from "../src/lib/types";
import { goalProgress, nextBillDate, savePlan, validatePlan } from "../src/lib/planning";
import { filterStateByCurrency, availableCurrencies } from "../src/lib/currency";
import { encodeBackup, decodeBackup, planRestore, validateBackup } from "../src/lib/backup";

const goal: SavingsGoal = { id: "goal", revision: 0, name: "Emergency fund", currency: "USD", target: 1200, saved: 300, monthlyContribution: 150, targetDate: "2027-04-23" };
const bill: BillReminder = { id: "bill", revision: 0, name: "Internet", currency: "USD", amount: 45, frequency: "MONTHLY", dueDate: "2026-01-31", status: "active", note: "" };

test("goal progress handles completed, overdue, zero contribution and undated plans", () => {
  const progress = goalProgress(goal, "2026-10-23");
  assert.equal(progress.remaining, 900); assert.equal(progress.percent, 25); assert.equal(progress.needed, 150); assert.equal(progress.status, "On plan");
  assert.equal(goalProgress({ ...goal, saved: 1500 }, "2027-05-01").status, "Complete");
  assert.equal(goalProgress({ ...goal, saved: 1500 }, "2027-05-01").percent, 100);
  assert.equal(goalProgress(goal, "2027-05-01").status, "Past target date");
  assert.equal(goalProgress({ ...goal, monthlyContribution: 0 }, "2026-10-23").status, "Increase monthly savings");
  assert.equal(goalProgress({ ...goal, targetDate: null }, "2026-10-23").needed, null);
  assert.equal(goalProgress(goal, "2027-04-23").needed, 900);
});

test("bill dates keep month-end anchors, leap dates and weekly intervals", () => {
  assert.equal(nextBillDate(bill, "2026-02-01"), "2026-02-28");
  assert.equal(nextBillDate(bill, "2026-03-01"), "2026-03-31");
  assert.equal(nextBillDate(bill, "2026-01-31"), "2026-01-31");
  assert.equal(nextBillDate({ ...bill, dueDate: "2024-02-29", frequency: "ANNUALLY" }, "2025-01-01"), "2025-02-28");
  assert.equal(nextBillDate({ ...bill, dueDate: "2024-02-29", frequency: "ANNUALLY" }, "2028-01-01"), "2028-02-29");
  assert.equal(nextBillDate({ ...bill, dueDate: "2026-10-01", frequency: "WEEKLY" }, "2026-10-23"), "2026-10-29");
  assert.equal(nextBillDate({ ...bill, dueDate: "2026-10-01", frequency: "BIWEEKLY" }, "2026-10-23"), "2026-10-29");
});

test("plan mutations reject stale edits and duplicate budgets, and tolerate retries", () => {
  const meta = emptyMeta();
  const saved = savePlan(meta, "goals", goal) as SavingsGoal;
  assert.equal(saved.revision, 1); assert.equal(meta.goals?.length, 1);
  assert.deepEqual(savePlan(meta, "goals", goal), saved);
  assert.equal(meta.goals?.length, 1);
  assert.throws(() => savePlan(meta, "goals", { ...goal, saved: 400 }), /changed/);
  const updated = savePlan(meta, "goals", { ...saved, saved: 400 });
  assert.equal(updated.revision, 2);
  assert.deepEqual(savePlan(meta, "goals", { ...saved, saved: 400 }), updated);
  const budget = { id: "food", revision: 0, currency: "USD", category: "FOOD_AND_DRINK", limit: 450 };
  savePlan(meta, "budgets", budget);
  assert.throws(() => savePlan(meta, "budgets", { ...budget, id: "duplicate" }), /already exists/);
  savePlan(meta, "budgets", { ...budget, id: "eur", currency: "EUR" });
  assert.equal(meta.budgets?.length, 2);
});

test("plan validation rejects invalid dates, amounts, categories and untrusted fields", () => {
  for (const target of [0, -1, NaN, Infinity, "100", 0.001, 1e10]) assert.throws(() => validatePlan("goals", { ...goal, target }));
  for (const targetDate of ["2026-02-30", "not a date", "2026-13-01", "9999-01-01"]) assert.throws(() => validatePlan("goals", { ...goal, targetDate }));
  assert.throws(() => validatePlan("goals", { ...goal, saved: -1 }));
  assert.throws(() => validatePlan("goals", { ...goal, name: " " }));
  assert.throws(() => validatePlan("billReminders", { ...bill, status: "pending" }));
  assert.throws(() => validatePlan("budgets", { id: "bad", revision: 0, currency: "USD", category: "INCOME", limit: 100 }));
  assert.deepEqual(validatePlan("goals", { ...goal, injected: "discard" }), goal);
});

test("plans stay in their currency and survive encrypted backup and additive restore", () => {
  const key = process.env.ENCRYPTION_KEY; process.env.ENCRYPTION_KEY = "77".repeat(32);
  try {
    const meta = emptyMeta();
    savePlan(meta, "goals", goal); savePlan(meta, "billReminders", bill);
    savePlan(meta, "budgets", { id: "budget", revision: 0, currency: "EUR", category: "TRAVEL", limit: 150 });
    const state = { ...emptyState(), goals: meta.goals, budgets: meta.budgets, billReminders: meta.billReminders };
    assert.deepEqual(availableCurrencies(state), ["EUR", "USD"]);
    assert.equal(filterStateByCurrency(state, "EUR").goals?.length, 0);
    assert.equal(filterStateByCurrency(state, "USD").budgets?.length, 0);
    const encoded = encodeBackup({ bundles: [], meta });
    assert.doesNotMatch(encoded, /Emergency fund|Internet/);
    const archive = decodeBackup(encoded);
    assert.deepEqual(archive.meta, meta);
    const restored = planRestore({ bundles: [], meta: emptyMeta() }, archive);
    assert.deepEqual(restored.conflicts, []); assert.deepEqual(restored.meta, meta);
    const changed = structuredClone(meta); changed.goals![0].saved = 800;
    assert.match(planRestore({ bundles: [], meta: changed }, archive).conflicts.join(" "), /Changed goals/);
    const duplicate = structuredClone(meta); duplicate.budgets![0].id = "another";
    assert.match(planRestore({ bundles: [], meta: duplicate }, archive).conflicts.join(" "), /Duplicate category budgets/);
    archive.meta.billReminders![0].dueDate = "2026-02-30";
    assert.throws(() => validateBackup(archive), /Invalid backup/);
  } finally { if (key === undefined) delete process.env.ENCRYPTION_KEY; else process.env.ENCRYPTION_KEY = key; }
});
