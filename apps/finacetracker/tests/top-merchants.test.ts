import test from "node:test";
import assert from "node:assert/strict";
import {
  topMerchants,
  injectBaselines,
  spendingByCategory,
  isSyntheticBaseline,
} from "../src/lib/analytics";
import { newMerchants } from "../src/lib/insights";
import type {
  Account,
  AppState,
  RecurringBaseline,
  Transaction,
} from "../src/lib/types";

// The "Top merchants" tiles link to /transactions?merchant=<name>, and the
// Activity feed hides synthetic "(estimated)" baseline rows. A baseline listed
// as a merchant therefore drilled through to an empty list — and a baseline
// saved twice showed as "2×" while inflating every total.

let seq = 0;
function tx(
  partial: Partial<Transaction> & { amount: number; date: string },
): Transaction {
  return {
    id: `t_${seq++}`,
    accountId: "acct_1",
    currency: "USD",
    name: partial.merchantName ?? "Charge",
    merchantName: null,
    pending: false,
    categoryPrimary: "FOOD_AND_DRINK",
    categoryDetailed: null,
    paymentChannel: null,
    source: "plaid",
    userCategory: null,
    note: null,
    hidden: false,
    ...partial,
  };
}

const account: Account = {
  id: "acct_1",
  itemId: "item_1",
  name: "Checking",
  officialName: null,
  mask: null,
  type: "depository",
  subtype: null,
  currency: "USD",
  balances: { current: 100, available: null, limit: null },
  source: "plaid",
};

const rentBaseline: RecurringBaseline = {
  id: "base_a",
  name: "Rent & Parking",
  amount: 3200,
  category: "RENT_AND_UTILITIES",
  startMonth: "2026-05",
};

function stateWith(baselines: RecurringBaseline[]): AppState {
  return injectBaselines({
    version: 1,
    items: [],
    accounts: [account],
    transactions: [
      tx({ merchantName: "Chipotle", amount: 30, date: "2026-06-03" }),
      tx({ merchantName: "Chipotle", amount: 20, date: "2026-06-18" }),
      tx({ merchantName: "DoorDash", amount: 90, date: "2026-06-12" }),
      tx({ merchantName: "Chipotle", amount: 40, date: "2026-05-10" }),
    ],
    recurring: [],
    manualEntries: [],
    baselines,
    snapshots: [],
    updatedAt: null,
  });
}

test("topMerchants leaves out synthetic baseline rows", () => {
  const state = stateWith([rentBaseline]);
  // The baseline did inject — it's the tile that must ignore it.
  assert.equal(
    state.transactions.filter((t) => isSyntheticBaseline(t) && t.date.startsWith("2026-06"))
      .length,
    1,
  );
  assert.deepEqual(
    topMerchants(state, "2026-06", 20).map((m) => m.name),
    ["DoorDash", "Chipotle"],
  );
});

test("a baseline saved twice can't show up as a 2× merchant", () => {
  const state = stateWith([rentBaseline, { ...rentBaseline, id: "base_b" }]);
  assert.equal(
    topMerchants(state, "2026-06", 20).find((m) => m.name === "Rent & Parking"),
    undefined,
  );
});

test("the baseline still counts toward the category total", () => {
  const cats = spendingByCategory(stateWith([rentBaseline]), "2026-06");
  assert.equal(cats.find((c) => c.category === "RENT_AND_UTILITIES")?.total, 3200);
});

test("a baseline saved twice injects one estimated row, not two", () => {
  const state = stateWith([rentBaseline, { ...rentBaseline, id: "base_b" }]);
  const june = state.transactions.filter(
    (t) => isSyntheticBaseline(t) && t.date.startsWith("2026-06"),
  );
  assert.equal(june.length, 1);
  assert.equal(june[0].amount, 3200);
  const cats = spendingByCategory(state, "2026-06");
  assert.equal(cats.find((c) => c.category === "RENT_AND_UTILITIES")?.total, 3200);
});

test("re-saving a baseline supersedes the old amount from its start month on", () => {
  // Rent went 3200 -> 3600 in June; May must still bill at the old rate.
  const raised: RecurringBaseline = {
    ...rentBaseline,
    id: "base_b",
    amount: 3600,
    startMonth: "2026-06",
  };
  const state = stateWith([rentBaseline, raised]);
  const byMonth = (m: string) =>
    state.transactions.filter((t) => isSyntheticBaseline(t) && t.date.startsWith(m));
  assert.deepEqual(byMonth("2026-05").map((t) => t.amount), [3200]);
  assert.deepEqual(byMonth("2026-06").map((t) => t.amount), [3600]);
});

test("different bills in one category both still inject", () => {
  const storage: RecurringBaseline = {
    ...rentBaseline,
    id: "base_c",
    name: "Storage Unit",
    amount: 180,
  };
  const state = stateWith([rentBaseline, storage]);
  const june = state.transactions
    .filter((t) => isSyntheticBaseline(t) && t.date.startsWith("2026-06"))
    .map((t) => t.amount)
    .sort((a, b) => a - b);
  assert.deepEqual(june, [180, 3200]);
});

test("a recently added baseline isn't reported as a new merchant", () => {
  // Six months of history so newMerchants computes, with the baseline starting
  // inside the recent window — otherwise its first row falls outside and the
  // test would pass whether or not the filter is there.
  const base = stateWith([]);
  const spread: Transaction[] = [];
  for (const m of ["01", "02", "03", "04", "05"]) {
    spread.push(tx({ merchantName: "Chipotle", amount: 10, date: `2026-${m}-05` }));
  }
  const state = injectBaselines({
    ...base,
    transactions: [...base.transactions, ...spread],
    baselines: [{ ...rentBaseline, startMonth: "2026-05" }],
  });
  const firstSynthetic = state.transactions
    .filter(isSyntheticBaseline)
    .map((t) => t.date)
    .sort()[0];
  assert.equal(firstSynthetic, "2026-05-01"); // inside the last 3 months
  assert.ok(!newMerchants(state, 12).some((m) => m.name === "Rent & Parking"));
});
