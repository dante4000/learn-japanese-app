import test from "node:test";
import assert from "node:assert/strict";
import { incomeSourceLabel } from "../src/lib/aliases";
import { filterBySource, incomeBreakdown, incomeMonths, mergeIncomeMonths } from "../src/lib/insights";
import { emptyState, Transaction } from "../src/lib/types";

let sequence = 0;
function deposit(name: string, date = "2026-03-15", amount = -100): Transaction {
  return {
    id: `income-${sequence++}`, accountId: "checking", currency: "USD",
    name, merchantName: null, date, amount, pending: false,
    categoryPrimary: "INCOME", categoryDetailed: null, paymentChannel: null,
    source: "plaid", userCategory: null, note: null, hidden: false,
  };
}

test("bank metadata and letter case do not split the same income payer", () => {
  assert.equal(incomeSourceLabel(null, "Shopify TRANSFER CCD ID: 123456789"), "SHOPIFY");
  assert.equal(incomeSourceLabel("SHOPIFY", "Shopify transfer"), "SHOPIFY");
  assert.equal(incomeSourceLabel(null, "Zelle payment from RareLiquid LLC ABC123456789"), "RARELIQUID");
  assert.equal(incomeSourceLabel(null, "ACH CREDIT Acme PPD ID: 123"), "ACME");
  assert.equal(incomeSourceLabel(null, "RARELIQUID LLC PAYROLL"), "RARELIQUID");
});

test("source filters are exact and preserve distinct business names", () => {
  const state = emptyState();
  state.transactions = [deposit("Acme"), deposit("ACME CONSULTING"), deposit("Acme2")];
  assert.deepEqual(filterBySource(state, "acme").transactions.map((t) => t.name), ["Acme"]);
  assert.equal(incomeSourceLabel(null, "Acme2"), "ACME2");
  assert.equal(incomeSourceLabel(null, "Studio 54"), "STUDIO 54");
  assert.equal(incomeSourceLabel(null, "Acme Transfer"), "ACME TRANSFER");
});

test("income source breakdown retains every payer beyond the color palette", () => {
  const state = emptyState();
  state.transactions = Array.from({ length: 12 }, (_, i) => deposit(`Payer ${i}`));
  const breakdown = incomeBreakdown(state);
  assert.equal(breakdown.legend.length, 12);
  assert.equal(breakdown.byMonth[0].segments.length, 12);
  assert.equal(mergeIncomeMonths(breakdown.byMonth).segments.length, 12);
  assert.equal(breakdown.byMonth[0].total, 1200);
});

test("missing calendar months have zero income, including later posted activity", () => {
  const state = emptyState();
  state.transactions = [deposit("Acme", "2025-12-01"), deposit("Acme", "2026-03-01")];
  const spending = deposit("Shop", "2026-04-01", 20);
  spending.categoryPrimary = "GENERAL_MERCHANDISE";
  state.transactions.push(spending);
  assert.deepEqual(incomeMonths(state), ["2025-12", "2026-01", "2026-02", "2026-03", "2026-04"]);
  assert.deepEqual(incomeBreakdown(state).byMonth.map((m) => m.total), [100, 0, 0, 100, 0]);
});

test("hidden and pending inflows do not create sources or income months", () => {
  const state = emptyState();
  const hidden = deposit("Hidden"); hidden.hidden = true;
  const pending = deposit("Pending"); pending.pending = true;
  state.transactions = [hidden, pending];
  assert.deepEqual(incomeMonths(state), []);
  assert.deepEqual(incomeBreakdown(state).legend, []);
});
