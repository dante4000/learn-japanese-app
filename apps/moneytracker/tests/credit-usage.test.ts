import test from "node:test";
import assert from "node:assert/strict";
import { detectCreditUsage, CARD_CATALOG } from "../src/lib/cards";
import type { CardCatalogEntry } from "../src/lib/cards";
import type { AppState, Transaction } from "../src/lib/types";

let seq = 0;
function tx(
  partial: Partial<Transaction> & { amount: number; date: string },
): Transaction {
  return {
    id: `t_${seq++}`,
    accountId: "acct_1",
    currency: "USD",
    name: "Charge",
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

function state(transactions: Transaction[]): AppState {
  return {
    version: 1,
    items: [],
    accounts: [],
    transactions,
    recurring: [],
    manualEntries: [],
    baselines: [],
    snapshots: [],
    updatedAt: null,
  } as unknown as AppState;
}

const csr = CARD_CATALOG.find((c) => c.cardKey === "sapphire-reserve")!;
function usage(s: AppState, creditName: string) {
  return detectCreditUsage(s, "acct_1", csr).find((u) => u.creditName === creditName)!;
}

test("Exclusive Tables credit is detected from the Chase statement-credit posting", () => {
  const s = state([
    // The dining charge posts as the restaurant — names nothing about the credit.
    tx({ amount: 220, date: "2026-05-10", name: "DON ANGIE", merchantName: "Don Angie" }),
    // Chase posts the $150 credit as an inflow whose descriptor names it.
    tx({
      amount: -150,
      date: "2026-05-12",
      name: "EXCLUSIVE TABLES CREDIT",
      merchantName: null,
      categoryPrimary: "FOOD_AND_DRINK",
    }),
  ]);
  const u = usage(s, "Exclusive Tables dining credit");
  assert.equal(u.detectable, true);
  assert.equal(u.usedThisPeriod, true, "current half-year should register the credit");
  assert.equal(u.captured, 150);
  assert.equal(u.count12mo, 1);
  assert.equal(u.lastDate, "2026-05-12");
});

test("a bare restaurant charge alone does NOT register the Exclusive Tables credit", () => {
  const s = state([
    tx({ amount: 220, date: "2026-05-10", name: "DON ANGIE", merchantName: "Don Angie" }),
  ]);
  const u = usage(s, "Exclusive Tables dining credit");
  assert.equal(u.usedThisPeriod, false);
  assert.equal(u.captured, 0);
});

test("an inflow does NOT trigger a credit that has no creditPostHints", () => {
  // The annual travel credit detects spend (uber/lyft/etc.) but must not be
  // fooled by a matching *refund* inflow — that's not a statement-credit capture.
  const s = state([
    tx({
      amount: -40,
      date: "2026-05-12",
      name: "UBER REFUND",
      merchantName: "Uber",
      categoryPrimary: "TRANSPORTATION",
    }),
  ]);
  const u = usage(s, "Annual travel credit");
  assert.equal(u.captured, 0, "a refund inflow must not count as travel-credit capture");
  assert.equal(u.usedThisPeriod, false);
});
