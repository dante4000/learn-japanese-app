import test from "node:test";
import assert from "node:assert/strict";
import { findPossibleDuplicates, BASELINE_ACCOUNT_ID } from "../src/lib/analytics";
import { emptyState, Transaction } from "../src/lib/types";

let sequence = 0;
function tx(patch: Partial<Transaction> = {}): Transaction {
  return {
    id: `duplicate-${sequence++}`, accountId: "account", amount: 12.5,
    currency: "USD", date: "2026-09-03", name: "Chipotle", merchantName: null,
    pending: false, categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: null,
    paymentChannel: null, source: "plaid", userCategory: null, note: null,
    hidden: false, ...patch,
  };
}
function duplicates(transactions: Transaction[]) {
  const state = emptyState(); state.transactions = transactions;
  return findPossibleDuplicates(state);
}

test("same-day equal purchases are possible duplicates", () => {
  const groups = duplicates([tx(), tx()]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].transactions.length, 2);
});

test("pending, hidden, transfers, and synthetic entries are excluded", () => {
  for (const patch of [{ pending: true }, { hidden: true }, { categoryPrimary: "TRANSFER_OUT" }, { accountId: BASELINE_ACCOUNT_ID }]) {
    assert.equal(duplicates([tx(patch), tx(patch)]).length, 0);
  }
  assert.equal(duplicates([tx({ name: "Payment to Chase card ending in 1234" }), tx({ name: "Payment to Chase card ending in 1234" })]).length, 0);
});

test("a refunded extra charge leaves no duplicate candidate", () => {
  assert.equal(duplicates([tx(), tx(), tx({ amount: -12.5, date: "2026-09-05" })]).length, 0);
});

test("charges on separate accounts or currencies do not merge", () => {
  assert.equal(duplicates([tx(), tx({ accountId: "other" })]).length, 0);
  assert.equal(duplicates([tx(), tx({ currency: "KRW" })]).length, 0);
});

test("adjacent posted dates form a narrow candidate window", () => {
  assert.equal(duplicates([tx(), tx({ date: "2026-09-04" })]).length, 1);
  assert.equal(duplicates([tx(), tx({ date: "2026-09-05" })]).length, 0);
  const groups = duplicates([tx(), tx({ date: "2026-09-04" }), tx({ date: "2026-09-05" })]);
  assert.equal(groups[0].transactions.length, 2);
});

test("common repeat merchants and unrelated recurring streams do not suppress candidates", () => {
  const state = emptyState();
  state.transactions = [tx(), tx(), tx({ date: "2026-09-10" }), tx({ date: "2026-09-10" }), tx({ date: "2026-09-15" })];
  state.recurring = [{ id: "stream", accountId: "other", merchantName: "Chipotle", description: "Chipotle", categoryPrimary: "FOOD_AND_DRINK", frequency: "MONTHLY", averageAmount: 12.5, lastAmount: 12.5, firstDate: "2026-01-01", lastDate: "2026-09-01", predictedNextDate: null, isActive: true, type: "outflow", source: "plaid" }];
  assert.equal(findPossibleDuplicates(state).length, 2);
});

test("Unicode merchant names remain detectable", () => {
  assert.equal(duplicates([tx({ merchantName: "セブン" }), tx({ merchantName: "セブン" })]).length, 1);
  assert.equal(duplicates([tx({ merchantName: "카페" }), tx({ merchantName: "카페" })]).length, 1);
});

test("explicit store metadata matches merchant enrichment without merging numbered businesses", () => {
  assert.equal(duplicates([tx({ merchantName: "Starbucks" }), tx({ name: "STARBUCKS STORE 1234" })]).length, 1);
  assert.equal(duplicates([tx({ name: "Lot 12" }), tx({ name: "Lot 34" })]).length, 0);
});

test("three duplicate charges retain all exact IDs for review", () => {
  const charges = [tx(), tx(), tx()];
  const group = duplicates(charges)[0];
  assert.equal((group.transactions.length - 1) * group.amount, 25);
  assert.deepEqual(new Set(group.transactions.map((t) => t.id)), new Set(charges.map((t) => t.id)));
});
