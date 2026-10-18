import test from "node:test";
import assert from "node:assert/strict";
import { emptyState, type Transaction, type Account } from "../src/lib/types";
import { cashFlowByMonth, spendingByAccount, spendingByCategory, normalizeAccountTransactions, isIncome } from "../src/lib/analytics";
import { resolveCategoryKey } from "../src/lib/categories";
let n = 0;
function tx(amount: number, fields: Partial<Transaction> = {}): Transaction {
  return { id: `refund-${++n}`, accountId: "card", amount, currency: "USD", date: "2026-09-03", name: "Shop", merchantName: "Shop", pending: false, hidden: false, categoryPrimary: "GENERAL_MERCHANDISE", categoryDetailed: null, paymentChannel: null, source: "plaid", userCategory: null, note: null, ...fields };
}
test("full and partial refunds reduce spending when posted across every aggregate", () => {
  const state = { ...emptyState(), transactions: [tx(100), tx(-30), tx(50), tx(-50, { date: "2026-10-01" })] };
  assert.deepEqual(cashFlowByMonth(state).map(({spending}) => spending), [120, -50]);
  assert.equal(spendingByAccount(state).reduce((s, a) => s + a.total, 0), 70);
  assert.equal(spendingByCategory(state).reduce((s, a) => s + a.total, 0), 70);
});
test("unmatched refunds reduce spending and never create earned income", () => {
  const refund = tx(-40);
  assert.equal(isIncome(refund), false);
  assert.equal(cashFlowByMonth({ ...emptyState(), transactions: [refund] })[0].spending, -40);
});
test("card credits misclassified as salary use purchase category in the read model", () => {
  const raw = { ...emptyState(), accounts: [{ id: "card", type: "credit" } as Account], transactions: [tx(100), tx(-30, { categoryPrimary: "INCOME" }), tx(-15, { categoryPrimary: "INCOME", userCategory: "INCOME" })] };
  const normalized = normalizeAccountTransactions(raw);
  assert.equal(raw.transactions[1].categoryPrimary, "INCOME");
  assert.equal(normalized.transactions[1].categoryPrimary, "GENERAL_MERCHANDISE");
  assert.deepEqual(cashFlowByMonth(normalized).map(({income, spending}) => ({income, spending})), [{income:15, spending:70}]);
});
test("bank card settlements are transfers while utility autopays stay spending", () => {
  for (const name of ["ONLINE PAYMENT - THANK YOU", "AUTOMATIC PAYMENT - THANK", "Payment to Chase card ending in 1234", "BILT CARD PMT PPD ID: 1234"]) {
    assert.equal(resolveCategoryKey(tx(-500, { name, merchantName: null, categoryPrimary: "INCOME" })), "TRANSFER_IN", name);
  }
  for (const name of ["VERIZON WIRELESS AUTOPAY", "GEICO AUTOPAY", "Electric Company Autopay"]) {
    assert.equal(resolveCategoryKey(tx(80, { name, merchantName: null, categoryPrimary: "RENT_AND_UTILITIES" })), "RENT_AND_UTILITIES", name);
  }
});

test("generic card settlement text uses negative credit-account context", () => {
  for (const name of ["PAYMENT RECEIVED - THANK YOU", "AUTOMATIC PAYMENT", "AUTOPAY PAYMENT", "PAYMENT - BILT HOUSING"]) {
    const raw = { ...emptyState(), accounts: [{ id: "card", type: "credit" } as Account], transactions: [tx(-500, { name, merchantName: null, categoryPrimary: "INCOME" })] };
    const normalized = normalizeAccountTransactions(raw);
    assert.equal(normalized.transactions[0].categoryPrimary, "TRANSFER_IN", name);
    assert.equal(cashFlowByMonth(normalized)[0].spending, 0, name);
    assert.equal(cashFlowByMonth(normalized)[0].income, 0, name);
    assert.equal(raw.transactions[0].categoryPrimary, "INCOME", name);
  }
});

test("unknown card income credits do not invent income or negative spending", () => {
  const raw = { ...emptyState(), accounts: [{ id: "card", type: "credit" } as Account], transactions: [tx(-500, { name: "Unclassified credit", merchantName: null, categoryPrimary: "INCOME" })] };
  const normalized = normalizeAccountTransactions(raw);
  assert.equal(normalized.transactions[0].categoryPrimary, "TRANSFER_IN");
  assert.deepEqual(cashFlowByMonth(normalized).map(({ income, spending }) => ({ income, spending })), [{ income: 0, spending: 0 }]);
});

test("utility Payment descriptors and positive Bilt rent remain spending", () => {
  for (const name of ["PAYMENT - VERIZON WIRELESS", "PAYMENT - BILT HOUSING", "Rent Payment - Landlord"]) {
    const transaction = tx(80, { name, merchantName: null, categoryPrimary: "RENT_AND_UTILITIES" });
    const normalized = normalizeAccountTransactions({ ...emptyState(), accounts: [{ id: "card", type: "credit" } as Account], transactions: [transaction] });
    assert.equal(resolveCategoryKey(normalized.transactions[0]), "RENT_AND_UTILITIES", name);
  }
});

test("explicit bank-to-card payments remain transfers", () => {
  for (const name of ["Payment to Bank of America credit card ending in 1234", "Payment to Wells Fargo card ending in 1234", "Payment to U.S. Bank credit card ending in 1234", "BILT CARD HOUSING PPD ID: 1234"]) {
    assert.equal(resolveCategoryKey(tx(500, { name, merchantName: null, categoryPrimary: "OTHER" })), "TRANSFER_OUT", name);
  }
});

test("generic settlement descriptions do not suppress bank income or user overrides", () => {
  const transaction = tx(-500, { name: "PAYMENT RECEIVED", merchantName: null, categoryPrimary: "INCOME" });
  const bank = normalizeAccountTransactions({ ...emptyState(), accounts: [{ id: "card", type: "depository" } as Account], transactions: [transaction] });
  assert.equal(isIncome(bank.transactions[0]), true);
  const card = normalizeAccountTransactions({ ...emptyState(), accounts: [{ id: "card", type: "credit" } as Account], transactions: [{ ...transaction, userCategory: "INCOME" }] });
  assert.equal(isIncome(card.transactions[0]), true);
});

test("a small or different-currency prior purchase does not explain a large card credit", () => {
  for (const purchase of [tx(10), tx(500, { currency: "KRW" })]) {
    const normalized = normalizeAccountTransactions({ ...emptyState(), accounts: [{ id: "card", type: "credit" } as Account], transactions: [purchase, tx(-500, { categoryPrimary: "INCOME" })] });
    assert.equal(normalized.transactions[1].categoryPrimary, "TRANSFER_IN");
  }
});
