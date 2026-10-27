import test from "node:test";
import assert from "node:assert/strict";
import { emptyState, emptyMeta, type Account, type Item, type Transaction } from "../src/lib/types";
import { computeNetWorth, netWorthHistory } from "../src/lib/analytics";
import { budgetBasis, fitBudget } from "../src/lib/budget-preset";
import { saveBudgetPreference, savePlan } from "../src/lib/planning";
import { plaidClient, plaidSync } from "../src/lib/providers/plaid";
import { buildBundle } from "../src/lib/sync";
import { encrypt } from "../src/lib/crypto";
import { encodeBackup, decodeBackup } from "../src/lib/backup";

const account = (id: string, current: number, type: Account["type"] = "depository"): Account => ({ id, itemId: "test", name: id, officialName: null, mask: null, type, subtype: null, currency: "USD", balances: { current, available: current - 10, limit: null }, source: "plaid" });
const tx = (id: string, date: string, amount: number, categoryPrimary = "FOOD_AND_DRINK"): Transaction => ({ id, date, amount, categoryPrimary, accountId: "cash", currency: "USD", name: "Fixture", merchantName: null, categoryDetailed: null, paymentChannel: null, source: "plaid", pending: false, hidden: false, userCategory: null, note: null });

test("current totals use current balances and history ends at the exact headline", () => {
  const state = { ...emptyState(), accounts: [account("cash", 1000.10), account("joint", 200.20), account("card", 300.31, "credit")], snapshots: [{ date: "2026-10-27", totalAssets: 1, totalLiabilities: 0, netWorth: 1 }] };
  const current = computeNetWorth(state);
  assert.equal(current.totalAssets, 1200.30); assert.equal(current.totalLiabilities, 300.31); assert.equal(current.netWorth, 899.99);
  assert.equal(netWorthHistory(state, "2026-10-27").at(-1)?.netWorth, 899.99, "no transactions still has a current point");
  state.transactions = [tx("old", "2026-09-01", 20), tx("future", "2026-11-01", 1000)];
  const history = netWorthHistory(state, "2026-10-27");
  assert.equal(history.at(-1)?.date, "2026-10-27"); assert.equal(history.at(-1)?.netWorth, current.netWorth);
  state.accounts.push({ ...account("missing", 100), balances: { current: null, available: null, limit: null } });
  assert.equal(computeNetWorth(state).complete, false);
  assert.deepEqual(netWorthHistory(state, "2026-10-27"), [], "an old same-day total cannot stand in for current partial coverage");
});

test("budget reserves goals first, excludes current month and transfers, and balances every cent", () => {
  const state = emptyState();
  state.transactions = ["07", "08", "09"].flatMap((month) => [tx(`pay-${month}`, `2026-${month}-02`, -5000, "INCOME"), tx(`rent-${month}`, `2026-${month}-02`, 1500, "RENT_AND_UTILITIES"), tx(`food-${month}`, `2026-${month}-03`, 900), tx(`shop-${month}`, `2026-${month}-03`, 800, "GENERAL_MERCHANDISE"), tx(`transfer-${month}`, `2026-${month}-04`, 2000, "TRANSFER_OUT")]);
  state.transactions.push(tx("current-pay", "2026-10-02", -100, "INCOME"), { ...tx("pending", "2026-09-30", 9999), pending: true });
  state.goals = [{ id: "goal", revision: 1, currency: "USD", name: "Fixture", target: 6000, saved: 0, monthlyContribution: 2000, targetDate: null }];
  const basis = budgetBasis(state, "USD", "2026-10-27");
  assert.equal(basis.income, 5000); assert.equal(basis.goalReserve, 2000); assert.equal(basis.debtPayments, 0);
  const plan = fitBudget(basis, 5000, 1000);
  assert.equal(plan.savings, 2000); assert.equal(plan.total, 3000); assert.equal(plan.remaining, 0);
  assert.equal(plan.rows.find((r) => r.category === "RENT_AND_UTILITIES")?.limit, 1500);
  assert.equal(Math.round(plan.rows.reduce((sum, row) => sum + row.limit, 0) * 100), 300000);
  assert.equal(plan.rows.find((r) => r.category === "TRAVEL")?.limit, 0);
  const short = fitBudget(basis, 3000, 2000);
  assert.equal(short.shortfall, 500); assert.equal(short.remaining, -500); assert.equal(short.rows.find((r) => r.category === "FOOD_AND_DRINK")?.limit, 0);
  assert.equal(budgetBasis(state, "EUR", "2026-10-27").income, 0);
  assert.equal(budgetBasis(emptyState(), "USD", "2026-10-27").missingMonths.length, 3);
});

test("savings preferences persist, reject stale edits, and accept zero-spend budgets", () => {
  const meta = emptyMeta();
  const preference = { currency: "USD", revision: 0, income: 5000, savings: 2000 };
  saveBudgetPreference(meta, preference); saveBudgetPreference(meta, preference);
  assert.equal(meta.budgetPreferences?.length, 1);
  assert.throws(() => saveBudgetPreference(meta, { ...preference, savings: 1500 }), /changed/);
  savePlan(meta, "budgets", { id: "travel", revision: 0, category: "TRAVEL", currency: "USD", limit: 0 });
  assert.equal(meta.budgets?.[0].limit, 0);
  const oldKey = process.env.ENCRYPTION_KEY; process.env.ENCRYPTION_KEY = "42".repeat(32);
  try { assert.deepEqual(decodeBackup(encodeBackup({ bundles: [], meta })).meta.budgetPreferences, meta.budgetPreferences); }
  finally { if (oldKey === undefined) delete process.env.ENCRYPTION_KEY; else process.env.ENCRYPTION_KEY = oldKey; }
});

test("manual balance sync requests live data even if transaction sync fails; cached fallback stays labelled", async () => {
  const oldKey = process.env.ENCRYPTION_KEY; process.env.ENCRYPTION_KEY = "42".repeat(32);
  const client = plaidClient();
  const original = { sync: client.transactionsSync, live: client.accountsBalanceGet, cached: client.accountsGet, recurring: client.transactionsRecurringGet };
  const item: Item = { id: "test", provider: "plaid", institutionName: "Fixture", accessTokenEnc: encrypt("fixture-token"), cursor: "old", status: "healthy", error: null, lastSyncedAt: "2026-10-01", createdAt: "2026-01-01" };
  const raw = { account_id: "card", name: "Fixture card", type: "credit", subtype: "credit card", balances: { current: 400, available: 600, limit: 1000, iso_currency_code: "USD" } };
  let liveCalls = 0, cachedCalls = 0;
  try {
    client.transactionsSync = async () => { throw new Error("Transaction feed offline"); };
    client.transactionsRecurringGet = async () => { throw new Error("Not enabled"); };
    client.accountsBalanceGet = (async () => { liveCalls++; return { data: { accounts: [raw] } }; }) as unknown as typeof client.accountsBalanceGet;
    client.accountsGet = (async () => { cachedCalls++; return { data: { accounts: [{ ...raw, balances: { ...raw.balances, current: 100 } }] } }; }) as unknown as typeof client.accountsGet;
    const live = await plaidSync(item, true);
    assert.equal(live.balanceSource, "live"); assert.equal(liveCalls, 1); assert.equal(cachedCalls, 0); assert.equal(live.cursor, "old");
    const prior = { item, accounts: [account("card", 100, "credit")], transactions: [tx("keep", "2026-10-01", 20)], recurring: [] };
    const saved = buildBundle(item, prior, live);
    assert.equal(saved.accounts[0].balances.current, 400); assert.equal(saved.item.status, "error"); assert.equal(saved.item.lastSyncedAt, "2026-10-01"); assert.equal(saved.transactions.length, 1);
    client.accountsBalanceGet = async () => { throw new Error("Balance unavailable"); };
    const fallback = await plaidSync(item, true);
    assert.equal(fallback.balanceSource, "cached"); assert.match(fallback.balanceWarning!, /Live balance refresh failed/);
    assert.match(buildBundle(item, prior, fallback).item.balanceWarning!, /Cached balances/);
    const background = await plaidSync(item);
    assert.equal(background.balanceSource, "cached"); assert.equal(background.balanceWarning, undefined);
  } finally {
    client.transactionsSync = original.sync; client.accountsBalanceGet = original.live; client.accountsGet = original.cached; client.transactionsRecurringGet = original.recurring;
    if (oldKey === undefined) delete process.env.ENCRYPTION_KEY; else process.env.ENCRYPTION_KEY = oldKey;
  }
});
