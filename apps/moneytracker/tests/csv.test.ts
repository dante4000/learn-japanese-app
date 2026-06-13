import test from "node:test";
import assert from "node:assert/strict";
import { csvToTransactions } from "../src/lib/providers/csv";

test("CSV import preserves identical same-day duplicate charges", () => {
  const csv = [
    "Date,Description,Amount",
    "06/01/2026,Coffee,-5.00",
    "06/01/2026,Coffee,-5.00",
  ].join("\n");

  const result = csvToTransactions(csv, {
    accountId: "acct_1",
    outflowSign: "negative_is_outflow",
  });

  assert.equal(result.transactions.length, 2);
  assert.equal(result.transactions[0].amount, 5);
  assert.equal(result.transactions[1].amount, 5);
  assert.notEqual(result.transactions[0].id, result.transactions[1].id);
});

test("CSV duplicate occurrence ids stay stable across overlapping imports", () => {
  const oneRow = ["Date,Description,Amount", "06/01/2026,Coffee,-5.00"].join(
    "\n",
  );
  const twoRows = [
    "Date,Description,Amount",
    "06/01/2026,Coffee,-5.00",
    "06/01/2026,Coffee,-5.00",
  ].join("\n");

  const first = csvToTransactions(oneRow, {
    accountId: "acct_1",
    outflowSign: "negative_is_outflow",
  });
  const second = csvToTransactions(twoRows, {
    accountId: "acct_1",
    outflowSign: "negative_is_outflow",
  });

  assert.equal(second.transactions[0].id, first.transactions[0].id);
  assert.notEqual(second.transactions[1].id, first.transactions[0].id);
});
