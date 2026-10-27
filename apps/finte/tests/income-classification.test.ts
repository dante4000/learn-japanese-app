import test from "node:test";
import assert from "node:assert/strict";
import { cashFlowByMonth, isIncome, isSpend } from "../src/lib/analytics";
import { resolveCategoryKey } from "../src/lib/categories";
import { incomeBreakdown, largestDepositsForMonths } from "../src/lib/insights";
import { csvToTransactions } from "../src/lib/providers/csv";
import { emptyState, Transaction } from "../src/lib/types";

function deposit(name: string, fields: Partial<Transaction> = {}): Transaction {
  return { id: name, accountId: "checking", amount: -100, currency: "USD", date: "2026-10-01", name, merchantName: null, pending: false, hidden: false, categoryPrimary: "INCOME", categoryDetailed: null, paymentChannel: null, source: "plaid", userCategory: null, note: null, ...fields };
}
const excludedNames = ["SHOPIFY TRANSFER", "IRS TREAS 310 TAX REF", "FRANCHISE TAX BD CASTTAXRFD", "FLASH SEATS, LLC", "REAL TIME PAYMENT CREDIT RECD FROM ABA/CONTR BNK-021214891 FROM: BNF-UNDERDOG SPORTS LLC CREDIT VIA TRUS REF: 4DDE0239551A4E43 INFO: TEXT-/VXR/", "Medical reimbursement", "Cash back reward"];

test("identified non-income deposits stay out of all income totals without becoming spending", () => {
  const excluded = excludedNames.map((name) => deposit(name));
  for (const t of excluded) {
    assert.equal(resolveCategoryKey(t), "OTHER_INFLOW", t.name);
    assert.equal(isIncome(t), false, t.name);
    assert.equal(isSpend(t), false, t.name);
    assert.equal(t.categoryPrimary, "INCOME", "raw bank category stays intact");
  }
  const salary = deposit("RARELIQUID LLC PAYROLL", { amount: -4000 });
  const state = { ...emptyState(), transactions: [...excluded, salary] };
  assert.equal(cashFlowByMonth(state)[0].income, 4000);
  assert.equal(incomeBreakdown(state).byMonth[0].total, 4000);
  assert.deepEqual(largestDepositsForMonths(state, ["2026-10"]).map((t) => t.id), [salary.id]);
});

test("user overrides, purchases, and spending refunds keep their category", () => {
  assert.equal(isIncome(deposit("SHOPIFY TRANSFER", { userCategory: "INCOME" })), true);
  assert.equal(resolveCategoryKey(deposit("FLASH SEATS, LLC", { amount: 100, categoryPrimary: "ENTERTAINMENT" })), "ENTERTAINMENT");
  const refund = deposit("Shopping refund", { categoryPrimary: "GENERAL_MERCHANDISE" });
  assert.equal(isSpend(refund), true);
  assert.equal(isIncome(refund), false);
  assert.equal(isIncome(deposit("Studio payroll", { pending: true })), false);
  assert.equal(isIncome(deposit("Studio payroll", { hidden: true })), false);
});

test("detailed tax-refund category and merchant evidence override broad income labels", () => {
  assert.equal(isIncome(deposit("Deposit", { categoryDetailed: "INCOME_TAX_REFUND" })), false);
  assert.equal(isIncome(deposit("Deposit", { merchantName: "Underdog Sports" })), false);
  assert.equal(isIncome(deposit("RARELIQUID LLC")), true);
});

test("CSV deposits need income evidence; explicit income and payroll remain supported", () => {
  const { transactions } = csvToTransactions("Date,Description,Amount,Category\n2026-10-01,Unknown deposit,200,\n2026-10-02,Studio payroll,3000,\n2026-10-03,Client payment,500,Income", { accountId: "checking", outflowSign: "negative_is_outflow" });
  assert.equal(resolveCategoryKey(transactions[0]), "OTHER_INFLOW");
  assert.equal(isIncome(transactions[0]), false);
  assert.equal(isIncome(transactions[1]), true);
  assert.equal(isIncome(transactions[2]), true);
});
