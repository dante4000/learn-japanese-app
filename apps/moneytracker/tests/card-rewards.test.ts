import test from "node:test";
import assert from "node:assert/strict";
import { CARD_CATALOG, estimatePointsDetailed, detectCreditUsage, cardSpend, cardSpendTxns } from "../src/lib/cards";
import { emptyState, type Transaction } from "../src/lib/types";

let sequence = 0;
function tx(amount: number, fields: Partial<Transaction> = {}): Transaction {
  return { id: `reward-${++sequence}`, accountId: "card", amount, currency: "USD", date: "2026-05-01",
    name: "Shop", merchantName: "Shop", pending: false, hidden: false, categoryPrimary: "GENERAL_MERCHANDISE",
    categoryDetailed: null, paymentChannel: null, source: "plaid", userCategory: null, note: null, ...fields };
}
const simple = { ...CARD_CATALOG[0], baseEarn: 1, earnModel: [] };
const bcp = CARD_CATALOG.find((card) => card.cardKey === "amex-blue-cash-preferred")!;
const groceries = { categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "FOOD_AND_DRINK_GROCERIES" };

// All fixtures are synthetic. The trailing window has prior-year cap context.
test("points reverse full and partial merchant refunds", () => {
  assert.equal(estimatePointsDetailed(simple, [tx(100), tx(-100, { date: "2026-05-02" })]).points, 0);
  assert.equal(estimatePointsDetailed(simple, [tx(100), tx(-40, { date: "2026-05-02" })]).points, 60);
});

test("point refunds retain the original earn rate and post in the refund window", () => {
  const transactions = [
    tx(100, { ...groceries, date: "2025-01-02" }),
    tx(-40, { date: "2025-11-03" }),
  ];
  assert.equal(estimatePointsDetailed(bcp, transactions, "2025-10-01").points, -240);
});

test("annual bonus caps reset in January and include purchases before the report window", () => {
  assert.equal(estimatePointsDetailed(bcp, [
    tx(6000, { ...groceries, date: "2025-12-01" }),
    tx(6000, { ...groceries, date: "2026-01-02" }),
  ]).points, 72000);
  const transactions = [
    tx(6000, { ...groceries, date: "2025-01-02" }),
    tx(1000, { ...groceries, date: "2025-11-03" }),
    tx(1, { date: "2026-10-01" }),
  ];
  const state = { ...emptyState(), transactions };
  const spend = cardSpend(state, "card");
  assert.equal(estimatePointsDetailed(bcp, cardSpendTxns(state, "card", true), spend.periodStart).points, 1001);
});

test("refund reversals preserve original rates without changing earlier capped earnings", () => {
  assert.equal(estimatePointsDetailed(bcp, [
    tx(6000, { ...groceries, date: "2026-01-02" }),
    tx(1000, { ...groceries, date: "2026-02-02", merchantName: "Other store" }),
    tx(-1000, { ...groceries, date: "2026-03-02" }),
    tx(1000, { ...groceries, date: "2026-04-02", merchantName: "Third store" }),
  ]).points, 32000);
  assert.equal(estimatePointsDetailed(bcp, [
    tx(6000, { ...groceries, date: "2026-01-02" }),
    tx(-1000, { ...groceries, date: "2026-02-02" }),
    tx(1000, { ...groceries, date: "2026-03-02" }),
  ]).points, 36000);
});

test("fees, payments, hidden, and pending entries earn no points", () => {
  assert.equal(estimatePointsDetailed(simple, [
    tx(95, { categoryPrimary: "BANK_FEES" }),
    tx(40, { name: "INTEREST CHARGE" }),
    tx(900, { name: "CARD PAYMENT" }),
    tx(100, { hidden: true }), tx(100, { pending: true }),
  ]).points, 0);
});

test("partial and full returns reduce inferred credit use", () => {
  for (const [refund, expected] of [[-30, 10], [-40, 0]]) {
    const transactions = [tx(40, { name: "UBER", merchantName: "Uber", categoryPrimary: "TRANSPORTATION" }),
      tx(refund, { date: "2026-05-02", name: "UBER REFUND", merchantName: "Uber", categoryPrimary: "TRANSPORTATION" })];
    const usage = detectCreditUsage({ ...emptyState(), transactions }, "card", CARD_CATALOG[0], "2026-05-20")
      .find((credit) => credit.creditName === "Annual travel credit")!;
    assert.equal(usage.captured, expected);
  }
});

test("confirmed same-merchant credits survive matching and do not reverse purchase rewards", () => {
  const transactions = [
    tx(10, { name: "Disney", merchantName: "Disney", categoryPrimary: "ENTERTAINMENT" }),
    tx(-10, { date: "2026-05-02", name: "DISNEY STREAMING CREDIT", merchantName: "Disney", categoryPrimary: "ENTERTAINMENT" }),
  ];
  const usage = detectCreditUsage({ ...emptyState(), transactions }, "card", bcp, "2026-05-20")
    .find((credit) => credit.creditName === "Disney streaming credit")!;
  assert.equal(usage.captured, 10);
  assert.equal(usage.currentSlot?.confidence, "confirmed");
  assert.equal(estimatePointsDetailed(bcp, transactions).points, 60);
  assert.equal(cardSpend({ ...emptyState(), transactions }, "card").count, 1);
});

test("an ordinary merchant return is not confirmed as a card benefit", () => {
  const platinum = CARD_CATALOG.find((card) => card.cardKey === "amex-platinum")!;
  const transactions = [tx(75, { name: "LULULEMON", merchantName: "Lululemon" }),
    tx(-75, { name: "LULULEMON REFUND", merchantName: "Lululemon", date: "2026-05-02" })];
  const usage = detectCreditUsage({ ...emptyState(), transactions }, "card", platinum, "2026-05-20")
    .find((credit) => credit.creditName.toLowerCase().includes("lululemon"))!;
  assert.equal(usage.captured, 0);
  assert.equal(estimatePointsDetailed(platinum, transactions).points, 0);
});

test("streaming bonuses require a selected merchant and whole-token matching", () => {
  assert.equal(estimatePointsDetailed(bcp, [
    tx(100, { name: "CarMax", merchantName: "CarMax" }),
    tx(20, { name: "Cinema", merchantName: "Cinema", categoryPrimary: "ENTERTAINMENT", categoryDetailed: "ENTERTAINMENT_TV_AND_MOVIES" }),
    tx(10, { name: "Max", merchantName: "Max", categoryPrimary: "ENTERTAINMENT" }),
  ]).points, 180);
});

test("Bilt purchase points exclude housing whose reward tier is computed separately", () => {
  const bilt = CARD_CATALOG.find((card) => card.cardKey === "bilt-mastercard")!;
  assert.equal(estimatePointsDetailed(bilt, [
    tx(4100, { name: "Bilt Housing Payment", merchantName: "Bilt", categoryPrimary: "RENT_AND_UTILITIES", categoryDetailed: "RENT_AND_UTILITIES_RENT" }),
    tx(50),
  ]).points, 50);
});
