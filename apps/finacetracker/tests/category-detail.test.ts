import test from "node:test";
import assert from "node:assert/strict";
import { categoryDetail } from "../src/lib/analytics";
import type { AppState, Transaction, RecurringStream } from "../src/lib/types";

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

const recurring: RecurringStream = {
  id: "r_1",
  accountId: "acct_1",
  description: "DoorDash Pass",
  merchantName: "DoorDash",
  categoryPrimary: "FOOD_AND_DRINK",
  frequency: "MONTHLY",
  averageAmount: 9.99,
  lastAmount: 9.99,
  firstDate: "2026-04-01",
  lastDate: "2026-06-01",
  predictedNextDate: "2026-07-01",
  isActive: true,
  type: "outflow",
  source: "plaid",
};

// A transfer-ish recurring stream in another category that must NOT show up.
const transferStream: RecurringStream = {
  ...recurring,
  id: "r_2",
  description: "Card Payment",
  categoryPrimary: "LOAN_PAYMENTS",
};

const state: AppState = {
  version: 1,
  items: [],
  accounts: [
    {
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
    },
  ],
  transactions: [
    // June — two merchants in Food & Drink
    tx({ merchantName: "Chipotle", amount: 30, date: "2026-06-03" }),
    tx({ merchantName: "Chipotle", amount: 20, date: "2026-06-18" }),
    tx({ merchantName: "DoorDash", amount: 90, date: "2026-06-12" }),
    // June — a different category, must be excluded
    tx({
      merchantName: "Delta",
      amount: 200,
      date: "2026-06-05",
      categoryPrimary: "TRAVEL",
    }),
    // June — hidden, must be excluded
    tx({ merchantName: "Chipotle", amount: 999, date: "2026-06-09", hidden: true }),
    // May — prior month, for the delta
    tx({ merchantName: "Chipotle", amount: 40, date: "2026-05-10" }),
    tx({ merchantName: "DoorDash", amount: 50, date: "2026-05-22" }),
  ],
  recurring: [recurring, transferStream],
  manualEntries: [],
  baselines: [],
  snapshots: [],
  updatedAt: null,
};

test("categoryDetail totals only the category's spend for the month", () => {
  const d = categoryDetail(state, "FOOD_AND_DRINK", "2026-06");
  assert.equal(d.total, 140); // 30 + 20 + 90, excludes Travel + hidden
  assert.equal(d.count, 3);
  assert.equal(d.prevTotal, 90); // May: 40 + 50
});

test("categoryDetail groups merchants biggest-first with vs-last-month deltas", () => {
  const d = categoryDetail(state, "FOOD_AND_DRINK", "2026-06");
  assert.deepEqual(
    d.merchants.map((m) => m.name),
    ["DoorDash", "Chipotle"],
  );
  const door = d.merchants[0];
  assert.equal(door.total, 90);
  assert.equal(door.prevTotal, 50);
  assert.equal(Math.round(door.deltaPct!), 80); // 50 -> 90
  const chip = d.merchants[1];
  assert.equal(chip.total, 50);
  assert.equal(chip.count, 2);
  assert.equal(Math.round(chip.deltaPct!), 25); // 40 -> 50
  // each merchant's transactions are newest-first
  assert.ok(chip.transactions[0].date >= chip.transactions[1].date);
});

test("categoryDetail surfaces the biggest single charge first", () => {
  const d = categoryDetail(state, "FOOD_AND_DRINK", "2026-06");
  assert.equal(d.biggest[0].amount, 90);
  assert.ok(d.biggest.length <= 5);
});

test("categoryDetail lists only active, non-transfer recurring in the category", () => {
  const d = categoryDetail(state, "FOOD_AND_DRINK", "2026-06");
  assert.equal(d.recurring.length, 1);
  assert.equal(d.recurring[0].id, "r_1");
});

test("categoryDetail computes share of the month's total spend", () => {
  const d = categoryDetail(state, "FOOD_AND_DRINK", "2026-06");
  // Month spend = 140 (food) + 200 (travel) = 340
  assert.equal(Math.round(d.shareOfMonth * 100), Math.round((140 / 340) * 100));
});

test("categoryDetail handles a month with no prior month", () => {
  const d = categoryDetail(state, "FOOD_AND_DRINK", "2026-05");
  assert.equal(d.prevMonth, null);
  assert.equal(d.prevTotal, null);
  assert.equal(d.deltaPct, null);
});
