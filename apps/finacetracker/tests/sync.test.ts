import test from "node:test";
import assert from "node:assert/strict";
import { buildBundle } from "../src/lib/sync";
import { emptySyncResult } from "../src/lib/providers/types";
import { emptyState, type Account, type Item, type ItemBundle, type RecurringStream, type Transaction } from "../src/lib/types";
import { allRecurringStreams, computeNetWorth } from "../src/lib/analytics";

const item: Item = {
  id: "test_item", provider: "plaid", institutionName: "Test bank",
  accessTokenEnc: "", cursor: null, status: "healthy", error: null,
  lastSyncedAt: null, createdAt: "2026-01-01",
};
const stream = { id: "test_stream" } as RecurringStream;
const previous: ItemBundle = { item, accounts: [], transactions: [], recurring: [stream] };

test("a failed recurring refresh preserves saved streams", () => {
  const result = { ...emptySyncResult(), recurring: null };
  assert.deepEqual(buildBundle(item, previous, result).recurring, [stream]);
});

test("a successful empty recurring refresh clears saved streams", () => {
  assert.deepEqual(buildBundle(item, previous, emptySyncResult()).recurring, []);
});

const account: Account = { id: "card", itemId: item.id, name: "Old card", officialName: null, mask: "1234", type: "credit", subtype: "credit card", currency: "USD", balances: { current: 300, available: 700, limit: 1000 }, source: "plaid" };

test("complete account refresh retains missing account history without stale balances or reminders", () => {
  const transaction = { id: "purchase", accountId: account.id, date: "2026-01-01", source: "plaid" } as Transaction;
  const prior = { ...previous, accounts: [account], transactions: [transaction], recurring: [{ ...stream, accountId: account.id, isActive: true }] };
  const next = buildBundle(item, prior, { ...emptySyncResult(), accountsComplete: true, recurring: null });
  assert.equal(next.accounts[0].availability, "unavailable");
  assert.deepEqual(next.accounts[0].lastReportedBalances, account.balances);
  assert.equal(next.accounts[0].balances.current, null);
  assert.deepEqual(next.transactions, [transaction]);
  assert.equal(allRecurringStreams({ ...emptyState(), accounts: next.accounts, recurring: next.recurring })[0].isActive, false);
  assert.equal(computeNetWorth({ ...emptyState(), accounts: next.accounts }).totalLiabilities, 0);
  const restored = buildBundle(item, next, { ...emptySyncResult(), accountsComplete: true, accounts: [account] });
  assert.equal(restored.accounts[0].availability, "reported");
  assert.equal(restored.accounts[0].balances.current, 300);
});

test("partial or failed account refresh does not archive or reactivate accounts", () => {
  const prior = { ...previous, accounts: [account] };
  assert.deepEqual(buildBundle(item, prior, emptySyncResult()).accounts, [account]);
  const archived = buildBundle(item, prior, { ...emptySyncResult(), accountsComplete: true });
  const fallback = buildBundle(item, archived, { ...emptySyncResult(), accounts: [account] });
  assert.equal(fallback.accounts[0].availability, "unavailable");
  assert.equal(fallback.accounts[0].balances.current, null);
});
