import test from "node:test";
import assert from "node:assert/strict";
import { filterStateByAccount } from "../src/lib/account-filter";
import type { AppState } from "../src/lib/types";

const state: AppState = {
  version: 1,
  items: [
    {
      id: "item_1",
      provider: "plaid",
      institutionName: "Bank",
      accessTokenEnc: "token",
      cursor: null,
      status: "healthy",
      error: null,
      lastSyncedAt: null,
      createdAt: "2026-06-01T00:00:00.000Z",
    },
  ],
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
    {
      id: "acct_2",
      itemId: "item_1",
      name: "Credit",
      officialName: null,
      mask: null,
      type: "credit",
      subtype: null,
      currency: "USD",
      balances: { current: 50, available: null, limit: null },
      source: "plaid",
    },
  ],
  transactions: [
    {
      id: "txn_1",
      accountId: "acct_1",
      amount: 10,
      currency: "USD",
      date: "2026-06-01",
      name: "Store",
      merchantName: null,
      pending: false,
      categoryPrimary: "GENERAL_MERCHANDISE",
      categoryDetailed: null,
      paymentChannel: null,
      source: "plaid",
      userCategory: null,
      note: null,
      hidden: false,
    },
    {
      id: "txn_2",
      accountId: "acct_2",
      amount: 20,
      currency: "USD",
      date: "2026-06-02",
      name: "Store",
      merchantName: null,
      pending: false,
      categoryPrimary: "GENERAL_MERCHANDISE",
      categoryDetailed: null,
      paymentChannel: null,
      source: "plaid",
      userCategory: null,
      note: null,
      hidden: false,
    },
  ],
  recurring: [
    {
      id: "rec_1",
      accountId: "acct_1",
      description: "Gym",
      merchantName: null,
      categoryPrimary: "PERSONAL_CARE",
      frequency: "MONTHLY",
      averageAmount: 30,
      lastAmount: 30,
      firstDate: "2026-01-01",
      lastDate: "2026-06-01",
      predictedNextDate: null,
      isActive: true,
      type: "outflow",
      source: "plaid",
    },
    {
      id: "rec_2",
      accountId: "acct_2",
      description: "Card Payment",
      merchantName: null,
      categoryPrimary: "TRANSFER_OUT",
      frequency: "MONTHLY",
      averageAmount: 30,
      lastAmount: 30,
      firstDate: "2026-01-01",
      lastDate: "2026-06-01",
      predictedNextDate: null,
      isActive: true,
      type: "outflow",
      source: "plaid",
    },
  ],
  manualEntries: [
    { id: "manual_1", name: "Car", kind: "asset", value: 5000, asOf: "2026-06-01" },
  ],
  baselines: [
    {
      id: "base_1",
      name: "Rent",
      amount: 2000,
      category: "RENT_AND_UTILITIES",
      startMonth: "2026-01",
    },
  ],
  snapshots: [
    {
      date: "2026-06-01",
      totalAssets: 5100,
      totalLiabilities: 50,
      netWorth: 5050,
    },
  ],
  updatedAt: null,
};

test("account filter removes global metadata from focused account views", () => {
  const scoped = filterStateByAccount(state, "acct_1");

  assert.deepEqual(
    scoped.accounts.map((a) => a.id),
    ["acct_1"],
  );
  assert.deepEqual(
    scoped.transactions.map((t) => t.id),
    ["txn_1"],
  );
  assert.deepEqual(
    scoped.recurring.map((r) => r.id),
    ["rec_1"],
  );
  assert.equal(scoped.manualEntries.length, 0);
  assert.equal(scoped.baselines.length, 0);
  assert.equal(scoped.snapshots.length, 0);
});
