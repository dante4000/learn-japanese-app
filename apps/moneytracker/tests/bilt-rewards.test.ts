import test from "node:test";
import assert from "node:assert/strict";
import {
  biltHousingRewards,
  statementCycle,
  biltEverydaySpend,
  findBiltAccount,
  resolveBiltMeter,
} from "../src/lib/bilt";
import { emptyState } from "../src/lib/types";
import type { Account, AppState, RecurringBaseline, Transaction } from "../src/lib/types";

let seq = 0;
function tx(
  partial: Partial<Transaction> & { amount: number; date: string },
): Transaction {
  return {
    id: `t_${seq++}`,
    accountId: "bilt_1",
    currency: "USD",
    name: "Charge",
    merchantName: null,
    pending: false,
    categoryPrimary: "GENERAL_MERCHANDISE",
    categoryDetailed: null,
    paymentChannel: null,
    source: "plaid",
    userCategory: null,
    note: null,
    hidden: false,
    ...partial,
  };
}

// ── biltHousingRewards: tier boundaries ──

test("below 25% earns only the 250-point floor", () => {
  const r = biltHousingRewards(1024, 4100); // ratio 0.2498
  assert.equal(r.multiplier, 0);
  assert.equal(r.points, 250);
  assert.equal(r.maxed, false);
});

test("exactly 25% unlocks 0.5x", () => {
  const r = biltHousingRewards(1025, 4100); // ratio 0.25
  assert.equal(r.multiplier, 0.5);
  assert.equal(r.points, Math.round(4100 * 0.5));
});

test("exactly 50% unlocks 0.75x", () => {
  const r = biltHousingRewards(2050, 4100);
  assert.equal(r.multiplier, 0.75);
});

test("just under 75% stays at 0.75x", () => {
  assert.equal(biltHousingRewards(3074, 4100).multiplier, 0.75); // ratio 0.7498
});

test("75% unlocks 1.0x and 99.9% stays 1.0x", () => {
  assert.equal(biltHousingRewards(3075, 4100).multiplier, 1.0); // 0.75
  assert.equal(biltHousingRewards(4099, 4100).multiplier, 1.0); // 0.9997
});

test("100% unlocks the max 1.25x and is flagged maxed", () => {
  const r = biltHousingRewards(4100, 4100);
  assert.equal(r.multiplier, 1.25);
  assert.equal(r.maxed, true);
  assert.equal(r.nextMultiplier, null);
  assert.equal(r.toNext, null);
  assert.equal(r.points, Math.round(4100 * 1.25));
});

test("spending past 100% stays 1.25x and maxed (dilution, not more points)", () => {
  const r = biltHousingRewards(6150, 4100); // ratio 1.5
  assert.equal(r.multiplier, 1.25);
  assert.equal(r.maxed, true);
});

test("toNext reports dollars of everyday spend to the next tier (screenshot case)", () => {
  const r = biltHousingRewards(663.47, 4100);
  assert.equal(r.multiplier, 0);
  assert.equal(r.nextMultiplier, 0.5);
  assert.ok(Math.abs(r.toNext! - 361.53) < 0.005);
});

// ── statementCycle: start-day anchored ──

test("cycle anchors to the most recent start-day on/before today", () => {
  const c = statementCycle("2026-06-30", 23);
  assert.equal(c.start, "2026-06-23");
  assert.equal(c.end, "2026-07-22");
});

test("a date before the start-day belongs to the previous cycle", () => {
  const c = statementCycle("2026-07-22", 23);
  assert.equal(c.start, "2026-06-23");
  assert.equal(c.end, "2026-07-22");
});

test("on the start-day itself, a new cycle begins", () => {
  const c = statementCycle("2026-07-23", 23);
  assert.equal(c.start, "2026-07-23");
  assert.equal(c.end, "2026-08-22");
});

test("cycle rolls over the year boundary (Dec -> Jan)", () => {
  const c = statementCycle("2026-12-30", 23);
  assert.equal(c.start, "2026-12-23");
  assert.equal(c.end, "2027-01-22");
});

// ── biltEverydaySpend: sum non-rent outflows on the Bilt account in-cycle ──

const cycle = statementCycle("2026-06-30", 23);

test("sums only non-rent outflows on the Bilt account within the cycle", () => {
  const txns = [
    tx({ amount: 50, date: "2026-06-24" }), // counts
    tx({ amount: 100, date: "2026-07-10" }), // counts
    tx({ amount: 4100, date: "2026-06-25", categoryPrimary: "RENT_AND_UTILITIES" }), // rent excluded
    tx({ amount: -30, date: "2026-06-26" }), // inflow/refund excluded
    tx({ amount: 999, date: "2026-06-22" }), // before cycle
    tx({ amount: 999, date: "2026-07-23" }), // after cycle
    tx({ amount: 70, date: "2026-06-27", accountId: "other" }), // other account
    tx({ amount: 80, date: "2026-06-28", hidden: true }), // hidden excluded
  ];
  assert.equal(biltEverydaySpend(txns, "bilt_1", cycle), 150);
});

test("rent excluded via userCategory override too", () => {
  const txns = [
    tx({ amount: 200, date: "2026-06-24", userCategory: "RENT_AND_UTILITIES" }),
    tx({ amount: 25, date: "2026-06-24" }),
  ];
  assert.equal(biltEverydaySpend(txns, "bilt_1", cycle), 25);
});

// ── resolveBiltMeter: end-to-end glue over AppState ──

function acct(partial: Partial<Account> & { id: string; name: string }): Account {
  return {
    itemId: "item_1",
    officialName: null,
    mask: null,
    type: "credit",
    subtype: "credit card",
    currency: "USD",
    balances: { current: 0, available: null, limit: null },
    source: "plaid",
    ...partial,
  } as Account;
}

function baseRent(amount: number): RecurringBaseline {
  return { id: "b1", name: "Rent", amount, category: "RENT_AND_UTILITIES", startMonth: "2026-01" };
}

function stateWith(over: Partial<AppState>): AppState {
  return { ...emptyState(), ...over };
}

test("findBiltAccount matches the Bilt card by name", () => {
  const state = stateWith({
    accounts: [acct({ id: "a1", name: "Chase Checking" }), acct({ id: "a2", name: "Bilt Obsidian" })],
  });
  assert.equal(findBiltAccount(state)?.id, "a2");
});

test("resolveBiltMeter returns null when no Bilt account is connected", () => {
  const state = stateWith({ accounts: [acct({ id: "a1", name: "Amex Platinum" })] });
  assert.equal(resolveBiltMeter(state, "2026-06-30"), null);
});

test("resolveBiltMeter uses the rent baseline for housing and sums everyday spend", () => {
  const state = stateWith({
    accounts: [acct({ id: "bilt_1", name: "Bilt Card" })],
    baselines: [baseRent(4100)],
    transactions: [tx({ amount: 663.47, date: "2026-06-24", accountId: "bilt_1" })],
  });
  const m = resolveBiltMeter(state, "2026-06-30")!;
  assert.equal(m.housingPayment, 4100);
  assert.equal(m.everydaySpend, 663.47);
  assert.equal(m.statementDay, 23);
  assert.equal(m.rewards.multiplier, 0);
  assert.equal(m.housingFromOverride, false);
});

test("resolveBiltMeter reads the rent baseline in force now, not the oldest", () => {
  // Re-saving a baseline supersedes the earlier entry rather than editing it,
  // so the meter must quote this month's rent — not the original amount.
  const state = stateWith({
    accounts: [acct({ id: "bilt_1", name: "Bilt Card" })],
    baselines: [
      baseRent(4100),
      { ...baseRent(4500), id: "b2", startMonth: "2026-06" },
    ],
  });
  assert.equal(resolveBiltMeter(state, "2026-06-30")!.housingPayment, 4500);
  assert.equal(resolveBiltMeter(state, "2026-05-30")!.housingPayment, 4100);
});

test("resolveBiltMeter prefers the housing override and configured statement day", () => {
  const state = stateWith({
    accounts: [acct({ id: "bilt_1", name: "Bilt Card" })],
    baselines: [baseRent(4100)],
    biltConfig: { housingOverride: 3000, statementDay: 1 },
  });
  const m = resolveBiltMeter(state, "2026-06-30")!;
  assert.equal(m.housingPayment, 3000);
  assert.equal(m.statementDay, 1);
  assert.equal(m.housingFromOverride, true);
  assert.equal(m.cycle.start, "2026-06-01");
});
