import test from "node:test";
import assert from "node:assert/strict";
import { monthlyEquivalent } from "../src/lib/recurring";
import { upcomingBills } from "../src/lib/analytics";
import { emptyState, type RecurringFrequency, type RecurringStream } from "../src/lib/types";

test("recurring monthly equivalents use exact annual occurrence counts", () => {
  const cases: [RecurringFrequency, number][] = [
    ["WEEKLY", 520], ["BIWEEKLY", 260], ["SEMI_MONTHLY", 240],
    ["MONTHLY", 120], ["ANNUALLY", 10], ["UNKNOWN", 120],
  ];
  for (const [frequency, expected] of cases) {
    assert.equal(monthlyEquivalent({ averageAmount: 120, frequency }), expected);
    assert.equal(monthlyEquivalent({ averageAmount: -120, frequency }), expected);
  }
});

test("upcoming bills and recurring displays share monthly equivalents", () => {
  const state = emptyState();
  const stream: RecurringStream = {
    id: "weekly", accountId: "account", description: "Weekly membership", merchantName: null,
    categoryPrimary: "PERSONAL_CARE", frequency: "WEEKLY", averageAmount: 120,
    lastAmount: 120, firstDate: "2026-01-01", lastDate: "2026-06-01",
    predictedNextDate: "2026-06-08", isActive: true, type: "outflow", source: "plaid",
  };
  state.recurring = [stream];
  assert.equal(upcomingBills(state, "2026-06-02").monthlyTotal, monthlyEquivalent(stream));
});
