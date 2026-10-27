import test from "node:test";
import assert from "node:assert/strict";
import { csvToTransactions, csvOverlapError, csvHistoryOverlap } from "../src/lib/providers/csv";
import { connectedInstitution, mapTransaction } from "../src/lib/providers/plaid";
import { buildBundle, refreshSnapshotAfterMutation } from "../src/lib/sync";
import { emptySyncResult } from "../src/lib/providers/types";
import type { Item, ItemBundle, Transaction } from "../src/lib/types";
import type { Transaction as PlaidTransaction } from "plaid";

const item: Item = { id: "bank", provider: "plaid", institutionName: "Bank", institutionId: "ins_1", accessTokenEnc: "", cursor: "before", status: "healthy", error: null, lastSyncedAt: null, createdAt: "2026-01-01" };
function row(overrides: Partial<Transaction> = {}): Transaction {
  return { id: "pending", accountId: "account", amount: 12, currency: "USD", date: "2026-06-01", name: "Coffee", merchantName: null, pending: true, categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: null, paymentChannel: null, source: "plaid", userCategory: null, note: null, hidden: false, ...overrides };
}
function bundle(transactions: Transaction[]): ItemBundle { return { item, accounts: [], transactions, recurring: [] }; }
function added(transactions: Transaction[]) { return { ...emptySyncResult(), added: transactions, cursor: "after" }; }

test("Plaid mapping retains pending identity and authorization date", () => {
  const mapped = mapTransaction({ transaction_id: "posted", account_id: "account", amount: 12, date: "2026-06-03", authorized_date: "2026-06-01", pending: false, pending_transaction_id: "pending", name: "Coffee" } as PlaidTransaction);
  assert.equal(mapped.pendingTransactionId, "pending");
  assert.equal(mapped.authorizedDate, "2026-06-01");
});

test("posted replacement carries pending edits and removes the authorization", () => {
  const pending = row({ userCategory: "OTHER", note: "Shared", hidden: true });
  const result = added([row({ id: "posted", pending: false, pendingTransactionId: "pending", amount: 15 })]);
  result.removed = ["pending"];
  const next = buildBundle(item, bundle([pending]), result);
  assert.equal(next.transactions.length, 1);
  assert.deepEqual([next.transactions[0].id, next.transactions[0].amount, next.transactions[0].userCategory, next.transactions[0].note, next.transactions[0].hidden], ["posted", 15, "OTHER", "Shared", true]);
  assert.equal(pending.id, "pending");
});

test("pending identity cannot copy edits across accounts", () => {
  const next = buildBundle(item, bundle([row({ note: "Private" })]), added([row({ id: "posted", accountId: "other", pending: false, pendingTransactionId: "pending" })]));
  assert.equal(next.transactions.find((t) => t.id === "posted")?.note, null);
  assert.equal(next.transactions.length, 2);
});

test("posted edits take precedence on subsequent updates", () => {
  const next = buildBundle(item, bundle([row({ note: "Pending edit" }), row({ id: "posted", pending: false, note: "Posted edit" })]), added([row({ id: "posted", pending: false, pendingTransactionId: "pending" })]));
  assert.equal(next.transactions[0].note, "Posted edit");
});

test("CSV imports reject linked date overlaps without guessing duplicate identity", () => {
  const history = [row({ date: "2026-06-01" })];
  assert.match(csvOverlapError(history, [row({ source: "csv", date: "2026-06-01", amount: 99 })], "account")!, /No rows were imported/);
  assert.match(csvOverlapError(history, [row({ source: "csv", date: "2026-07-01" })], "account")!, /1 CSV row/);
  assert.equal(csvOverlapError(history, [row({ source: "csv", date: "2026-05-31" })], "account"), null);
  assert.match(csvOverlapError([], [row({ source: "csv" })], "account")!, /no bank history/);
  assert.equal(csvOverlapError([], [], "account"), null);
});

test("provider backfill cannot silently double CSV history", () => {
  const previous = bundle([row({ id: "csv_1", source: "csv", date: "2026-05-15", pending: false })]);
  assert.throws(() => buildBundle(item, previous, added([row({ id: "bank_1", date: "2026-05-01" })])), /overlaps CSV history/);
  assert.equal(previous.item.cursor, "before");
  assert.equal(previous.transactions.length, 1);
  assert.equal(buildBundle(item, previous, added([row({ id: "bank_1", date: "2026-06-01" })])).transactions.length, 2);
});

test("explicit CSV category overrides merchant guesses and keeps refunds in category", () => {
  const result = csvToTransactions("Date,Description,Amount,Category\n2026-06-01,Amazon,-12,Groceries\n2026-06-02,Unknown,12,Shopping\n2026-06-03,Unknown,20,Payment", { accountId: "account", outflowSign: "negative_is_outflow" });
  assert.deepEqual(result.transactions.map((t) => t.categoryPrimary), ["FOOD_AND_DRINK", "GENERAL_MERCHANDISE", "TRANSFER_IN"]);
});

test("CSV keyword rules use word boundaries and specific merchant order", () => {
  const result = csvToTransactions("Date,Description,Amount\n2026-06-01,Current,-12\n2026-06-01,Uber Eats,-12\n2026-06-01,Gas Company,-12\n2026-06-01,Delta Dental,-12\n2026-06-01,Uber,-12", { accountId: "account", outflowSign: "negative_is_outflow" });
  assert.deepEqual(result.transactions.map((t) => t.categoryPrimary), ["OTHER", "FOOD_AND_DRINK", "RENT_AND_UTILITIES", "MEDICAL", "TRANSPORTATION"]);
});

test("duplicate institutions use provider identity and resolve legacy links", async () => {
  assert.equal(await connectedInstitution([item], "ins_1"), item);
  assert.equal(await connectedInstitution([item], "ins_2"), undefined);
  const legacy = { ...item, institutionId: undefined };
  assert.equal(await connectedInstitution([legacy], "ins_1", async () => "ins_1"), legacy);
  assert.equal(await connectedInstitution([{ ...legacy, provider: "csv" }], "ins_1", async () => { throw Error("must not look up CSV"); }), undefined);
  await assert.rejects(connectedInstitution([legacy], "ins_1", async () => { throw Error("Cannot verify identity"); }), /Cannot verify identity/);
});


test("CSV category lookup accepts normalized bank labels, display labels, and PFC keys", () => {
  const categories = ["Food & Drink", "FOOD_AND_DRINK", "Food and Drink", "food_and_drink", "  Shopping  ", "Bank Fees", "Bills & Utilities"];
  const csv = ["Date,Description,Amount,Category", ...categories.map((category) => `2026-06-01,Unknown,-12,${category}`)].join("\n");
  const result = csvToTransactions(csv, { accountId: "account", outflowSign: "negative_is_outflow" });
  assert.deepEqual(result.transactions.map((t) => t.categoryPrimary), ["FOOD_AND_DRINK", "FOOD_AND_DRINK", "FOOD_AND_DRINK", "FOOD_AND_DRINK", "GENERAL_MERCHANDISE", "BANK_FEES", "RENT_AND_UTILITIES"]);
});

test("shared history boundary isolates accounts and includes the boundary day", () => {
  const provider = [row({ accountId: "other", date: "2026-01-01" }), row({ date: "2026-06-03" }), row({ date: "2026-06-01" })];
  const csv = [row({ source: "csv", date: "2026-05-31" }), row({ source: "csv", date: "2026-06-01" }), row({ source: "csv", accountId: "other", date: "2026-07-01" })];
  assert.deepEqual(csvHistoryOverlap(provider, csv, "account"), { firstPlaidDate: "2026-06-01", count: 1 });
  assert.deepEqual(csvHistoryOverlap(provider, csv, "missing"), { firstPlaidDate: null, count: 0 });
});


test("snapshot failure after a committed mutation returns a warning without repeating the mutation", async () => {
  let writes = 0;
  let refreshes = 0;
  async function save() {
    writes++;
    return { ok: true, ...await refreshSnapshotAfterMutation(async () => {
      refreshes++;
      throw new Error("Storage write conflict");
    }) };
  }
  const result = await save();
  assert.equal(result.ok, true);
  assert.match(result.warning!, /Changes saved/);
  assert.match(result.warning!, /Do not submit again/);
  assert.equal(writes, 1);
  assert.equal(refreshes, 1);
  assert.deepEqual(await refreshSnapshotAfterMutation(async () => {}), {});
});
