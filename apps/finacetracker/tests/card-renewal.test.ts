import test from "node:test";
import assert from "node:assert/strict";
import { detectRenewal } from "../src/lib/cards";
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
    categoryPrimary: "BANK_FEES",
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
  };
}

// Only the fields detectRenewal reads. Cast through unknown so we don't have to
// build a full catalog entry for each case.
function card(partial: Partial<CardCatalogEntry>): CardCatalogEntry {
  return {
    cardKey: "test-card",
    annualFee: 95,
    ...partial,
  } as unknown as CardCatalogEntry;
}

const TODAY = "2026-06-24";

test("detects the renewal from a current-fee annual-membership charge", () => {
  const s = state([
    tx({ name: "ANNUAL MEMBERSHIP FEE", amount: 95, date: "2026-03-01" }),
  ]);
  const r = detectRenewal(s, "acct_1", card({ annualFee: 95 }), TODAY);
  assert.equal(r.detected, true);
  assert.equal(r.lastChargeDate, "2026-03-01");
  assert.equal(r.nextRenewal, "2027-03-01"); // Mar 1 already passed → next year
  assert.equal(r.daysUntil, 250);
  assert.equal(r.feeAmount, 95);
});

test("confirms the charge by the LEGACY fee amount, not just the sticker fee", () => {
  // User's CSR is still on the legacy $550 while the sticker is $795.
  const s = state([
    tx({ name: "Annual Membership Fee", amount: 550, date: "2026-01-15" }),
  ]);
  const r = detectRenewal(
    s,
    "acct_1",
    card({ annualFee: 795, legacyAnnualFee: 550 }),
    TODAY,
  );
  assert.equal(r.detected, true);
  assert.equal(r.lastChargeDate, "2026-01-15");
  assert.equal(r.nextRenewal, "2027-01-15");
  assert.equal(r.feeAmount, 550);
});

test("rolls a prior-year anniversary forward to its next future occurrence", () => {
  const s = state([
    tx({ name: "ANNUAL MEMBERSHIP FEE", amount: 95, date: "2025-11-10" }),
  ]);
  const r = detectRenewal(s, "acct_1", card({ annualFee: 95 }), TODAY);
  assert.equal(r.nextRenewal, "2026-11-10"); // still ahead of today this year
  assert.equal(r.daysUntil, 139);
});

test("renewal that lands exactly on today reads as 0 days", () => {
  const s = state([
    tx({ name: "ANNUAL MEMBERSHIP FEE", amount: 95, date: "2024-06-24" }),
  ]);
  const r = detectRenewal(s, "acct_1", card({ annualFee: 95 }), TODAY);
  assert.equal(r.nextRenewal, "2026-06-24");
  assert.equal(r.daysUntil, 0);
});

test("no fee charge but history present → ESTIMATES the anniversary from earliest txn", () => {
  const s = state([
    tx({ name: "GROCERY STORE", amount: 95, date: "2026-03-01", categoryPrimary: "FOOD_AND_DRINK" }),
    tx({ name: "GAS", amount: 40, date: "2026-05-10", categoryPrimary: "TRANSPORTATION" }),
  ]);
  const r = detectRenewal(s, "acct_1", card({ annualFee: 95 }), TODAY);
  assert.equal(r.detected, true);
  assert.equal(r.estimated, true);
  assert.equal(r.lastChargeDate, null);
  assert.equal(r.nextRenewal, "2027-03-01"); // earliest txn month/day, next future
  assert.equal(r.feeAmount, 95); // falls back to the sticker fee
});

test("no fee charge AND no account history → detected:false", () => {
  const s = state([
    tx({ name: "ANNUAL MEMBERSHIP FEE", amount: 95, date: "2026-03-01", accountId: "acct_other" }),
  ]);
  const r = detectRenewal(s, "acct_1", card({ annualFee: 95 }), TODAY);
  assert.equal(r.detected, false);
  assert.equal(r.estimated, false);
});

test("$0-fee card → detected:false without matching anything", () => {
  const s = state([
    tx({ name: "ANNUAL MEMBERSHIP FEE", amount: 0, date: "2026-03-01" }),
  ]);
  const r = detectRenewal(s, "acct_1", card({ annualFee: 0 }), TODAY);
  assert.equal(r.detected, false);
});

test("falls back to the most recent phrase match when no amount confirms", () => {
  // Fee posted with tax/adjustment ($99, not the $95 sticker) — still the real
  // renewal anchor even though the amount doesn't confirm.
  const s = state([
    tx({ name: "ANNUAL MEMBERSHIP FEE", amount: 99, date: "2026-02-20" }),
  ]);
  const r = detectRenewal(s, "acct_1", card({ annualFee: 95 }), TODAY);
  assert.equal(r.detected, true);
  assert.equal(r.lastChargeDate, "2026-02-20");
  assert.equal(r.feeAmount, 99);
});

test("prefers an amount-confirmed charge over a more recent phrase-only one", () => {
  const s = state([
    // more recent, but amount doesn't match the fee
    tx({ name: "ANNUAL MEMBERSHIP FEE REVERSAL DETAIL", amount: 12, date: "2026-05-01" }),
    // older, but the amount confirms the real fee
    tx({ name: "ANNUAL MEMBERSHIP FEE", amount: 95, date: "2026-02-01" }),
  ]);
  const r = detectRenewal(s, "acct_1", card({ annualFee: 95 }), TODAY);
  assert.equal(r.lastChargeDate, "2026-02-01");
  assert.equal(r.feeAmount, 95);
});

test("ignores charges on other accounts", () => {
  const s = state([
    tx({ name: "ANNUAL MEMBERSHIP FEE", amount: 95, date: "2026-03-01", accountId: "acct_other" }),
  ]);
  const r = detectRenewal(s, "acct_1", card({ annualFee: 95 }), TODAY);
  assert.equal(r.detected, false);
});

test("honors a card's custom feeChargeHints", () => {
  const s = state([
    tx({ name: "CARD ANNIVERSARY CHARGE", amount: 95, date: "2026-03-01" }),
  ]);
  const r = detectRenewal(
    s,
    "acct_1",
    card({ annualFee: 95, feeChargeHints: ["anniversary charge"] }),
    TODAY,
  );
  assert.equal(r.detected, true);
  assert.equal(r.lastChargeDate, "2026-03-01");
});
