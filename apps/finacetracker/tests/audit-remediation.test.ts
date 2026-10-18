import test from "node:test";
import assert from "node:assert/strict";
import { emptyState, type Account, type Item, type Transaction } from "../src/lib/types";
import { cashFlowDetail, injectBaselines, computeNetWorth, netWorthHistory, recordSnapshot } from "../src/lib/analytics";
import { filterStateByCurrency } from "../src/lib/currency";
import { resolveDetail, parseDetail, detailHref } from "../src/lib/details";
import { resolveBiltMeter } from "../src/lib/bilt";
import { csvCell } from "../src/lib/table-data";
import { parseCsv } from "../src/lib/providers/csv";
import { buildBundle } from "../src/lib/sync";
import { cashFlowTableRows } from "../src/components/CashFlowTable";
import { createLinkToken, plaidClient, plaidSync, revokeRemovedConnection } from "../src/lib/providers/plaid";
import { encrypt, sha256Hex } from "../src/lib/crypto";
import { sessionVersion, verifyPassword } from "../src/lib/auth";
import { scryptSync } from "node:crypto";

const account = (id: string, currency = "USD", current: number | null = 100): Account => ({ id, itemId: "bank", name: id, officialName: null, mask: null, type: "depository", subtype: "checking", currency, balances: { current, available: null, limit: null }, source: "plaid" });
const transaction = (date: string, currency = "USD", amount = 100): Transaction => ({ id: `${date}-${currency}`, accountId: currency, amount, currency, date, name: "Purchase", merchantName: null, pending: false, categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: null, paymentChannel: null, source: "plaid", userCategory: null, note: null, hidden: false });

test("unknown balances stay partial through totals, snapshots, and account details", () => {
  const missing = { ...account("missing", "USD", null), type: "credit" as const, availability: "unavailable" as const, lastReportedBalances: { current: 500, available: null, limit: null } };
  const state = { ...emptyState(), accounts: [account("USD"), missing], transactions: [transaction("2026-01-01")] };
  const result = computeNetWorth(state);
  assert.equal(result.complete, false); assert.deepEqual(result.missingAccounts.map((a) => a.id), ["missing"]);
  assert.equal(result.totalAssets, 100);
  recordSnapshot(state, "2026-10-17");
  assert.equal(state.snapshots[0].complete, false);
  assert.deepEqual(netWorthHistory(state, "2026-10-17"), [], "incomplete balances cannot anchor a fabricated history");
  const detail = resolveDetail(state, { metric: "account", account: "missing" });
  assert.equal(detail.summary[0].value, null);
  assert.match(detail.notes.join(" "), /Missing does not mean zero/);
});

test("currency scopes do not change with account order and details match their scope", () => {
  const state = { ...emptyState(), accounts: [account("EUR", "EUR", 200), account("USD")], transactions: [transaction("2026-10-01", "USD"), transaction("2026-10-01", "EUR", 70)] };
  assert.equal(computeNetWorth(state).netWorth, 100);
  assert.equal(computeNetWorth({ ...state, accounts: [...state.accounts].reverse() }).netWorth, 100);
  assert.equal(computeNetWorth(filterStateByCurrency(state, "EUR")).netWorth, 200);
  assert.equal(cashFlowDetail(filterStateByCurrency(state, "EUR")).avgSpending, 70);
  const query = { metric: "spending" as const, currency: "EUR", months: ["2026-10"] };
  assert.deepEqual(parseDetail(new URL(detailHref(query), "http://localhost").searchParams), query);
  const detail = resolveDetail(state, query);
  assert.equal(detail.currency, "EUR"); assert.equal(detail.rows.length, 1); assert.equal(detail.rows[0].values.contribution, 70);
  recordSnapshot(state, "2026-10-17");
  assert.deepEqual(state.snapshots.map((s) => [s.currency, s.netWorth]), [["EUR", 200], ["USD", 100]]);
});

test("calendar gaps remain visible and do not inflate the average denominator", () => {
  const detail = cashFlowDetail({ ...emptyState(), transactions: [transaction("2026-08-01"), transaction("2026-10-01")] }, 3);
  assert.deepEqual(detail.rows.map((r) => r.month), ["2026-08", "2026-09", "2026-10"]);
  assert.equal(detail.rows[1].hasActivity, false);
  assert.equal(detail.avgSpending, 100);
  const rows = cashFlowTableRows(detail.rows);
  assert.equal(rows[1].values.spending, null); assert.equal(rows[2].values.change, null);
  assert.match(String(rows[1].values.coverage), /unknown/);
});

test("closed and unavailable Bilt accounts cannot create current rewards", () => {
  const bilt = { ...account("bilt"), name: "Bilt Obsidian", type: "credit" as const };
  const state = { ...emptyState(), accounts: [bilt], biltConfig: { statementDay: 23, housingOverride: 4100 } };
  assert.ok(resolveBiltMeter(state, "2026-10-17"));
  assert.equal(resolveBiltMeter({ ...state, cardStatuses: { "bilt-mastercard": "closed" } }, "2026-10-17"), null);
  assert.equal(resolveBiltMeter({ ...state, accounts: [{ ...bilt, availability: "unavailable" }] }, "2026-10-17"), null);
  assert.equal(resolveBiltMeter({ ...state, accounts: [{ ...bilt, currency: "EUR" }] }, "2026-10-17"), null);
});

test("CSV text cannot become a formula and numeric debits retain their numeric value", () => {
  for (const input of ["=1+1", "+1", "@SUM(1)", "-1+2", " \t=1", "\ntext"]) {
    assert.equal(parseCsv(csvCell(input) + "\n")[0][0], "'" + input);
  }
  assert.equal(parseCsv(csvCell(-12.5) + "\n")[0][0], "-12.5");
  assert.equal(parseCsv(csvCell('A, "quoted"\nname') + "\n")[0][0], 'A, "quoted"\nname');
});

test("update-mode Link keeps the existing token and partial account sync exposes stale balances", async () => {
  const oldKey = process.env.ENCRYPTION_KEY; process.env.ENCRYPTION_KEY = "11".repeat(32);
  const client = plaidClient();
  const originalRemove = client.itemRemove;
  const originalLink = client.linkTokenCreate, originalTransactions = client.transactionsSync, originalAccounts = client.accountsGet, originalRecurring = client.transactionsRecurringGet;
  let payload: Record<string, unknown> = {};
  const item: Item = { id: "bank", provider: "plaid", institutionName: "Bank", accessTokenEnc: encrypt("fake-access-token"), cursor: "saved-cursor", status: "needs_reauth", error: "Expired", lastSyncedAt: "2026-01-01", balancesUpdatedAt: "2026-01-01", createdAt: "2026-01-01" };
  try {
    client.linkTokenCreate = (async (request: Record<string, unknown>) => { payload = request; return { data: { link_token: "fake-link-token" } }; }) as unknown as typeof client.linkTokenCreate;
    assert.equal(await createLinkToken(item), "fake-link-token");
    assert.equal(payload.access_token, "fake-access-token"); assert.equal(payload.products, undefined); assert.equal(payload.transactions, undefined);
    assert.equal(item.cursor, "saved-cursor");
    client.transactionsSync = (async () => ({ data: { accounts: [], added: [], modified: [], removed: [], next_cursor: "next", has_more: false } })) as unknown as typeof client.transactionsSync;
    client.accountsGet = async () => { throw new Error("Simulated balance outage"); };
    client.transactionsRecurringGet = async () => { throw new Error("Not enabled"); };
    const result = await plaidSync(item);
    assert.equal(result.accountsComplete, false); assert.match(result.balanceWarning!, /Balances could not refresh/);
    const prior = { item, accounts: [account("USD")], transactions: [{ ...transaction("2026-01-01"), note: "Keep", hidden: true }], recurring: [] };
    const next = buildBundle(item, prior, result);
    assert.equal(next.transactions[0].note, "Keep"); assert.equal(next.transactions[0].hidden, true);
    assert.equal(next.item.balancesUpdatedAt, "2026-01-01"); assert.ok(next.item.balanceWarning);
    assert.equal(next.accounts[0].balances.current, 100);
    client.itemRemove = async () => { throw new Error("Simulated provider failure"); };
    assert.match((await revokeRemovedConnection(item))!, /removed locally.*revocation failed/);
    client.itemRemove = (async () => ({})) as unknown as typeof client.itemRemove;
    assert.equal(await revokeRemovedConnection(item), undefined);
  } finally {
    client.itemRemove = originalRemove;
    client.linkTokenCreate = originalLink; client.transactionsSync = originalTransactions; client.accountsGet = originalAccounts; client.transactionsRecurringGet = originalRecurring;
    if (oldKey === undefined) delete process.env.ENCRYPTION_KEY; else process.env.ENCRYPTION_KEY = oldKey;
  }
});

test("password changes revoke session versions and scrypt verifies alongside legacy hashes", () => {
  const original = process.env.APP_PASSWORD_HASH;
  try {
    process.env.APP_PASSWORD_HASH = sha256Hex("test-only-password");
    const first = sessionVersion(); assert.equal(verifyPassword("test-only-password"), true);
    process.env.APP_PASSWORD_HASH = sha256Hex("changed"); assert.notEqual(sessionVersion(), first);
    const salt = "11".repeat(16);
    const digest = scryptSync("test-only-password", Buffer.from(salt, "hex"), 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex");
    process.env.APP_PASSWORD_HASH = `scrypt$${salt}$${digest}`;
    assert.equal(verifyPassword("test-only-password"), true); assert.equal(verifyPassword("wrong"), false);
  } finally { if (original === undefined) delete process.env.APP_PASSWORD_HASH; else process.env.APP_PASSWORD_HASH = original; }
});


test("posted housing matches only estimates in the same currency", () => {
  const state = { ...emptyState(), transactions: [{ ...transaction("2026-10-01"), categoryPrimary: "RENT_AND_UTILITIES", name: "Rent" }], baselines: [
    { id: "usd-rent", name: "Rent", amount: 100, category: "RENT_AND_UTILITIES", startMonth: "2026-10", endMonth: null },
    { id: "eur-rent", name: "Rent", amount: 80, category: "RENT_AND_UTILITIES", currency: "EUR", startMonth: "2026-10", endMonth: null },
  ] };
  const estimates = injectBaselines(state).transactions.filter((t) => t.id.startsWith("baseline_"));
  assert.deepEqual(estimates.map((t) => [t.currency, t.amount]), [["EUR", 80]]);
});
