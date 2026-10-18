import test from "node:test";
import assert from "node:assert/strict";
import { emptyState, type AppState, type RecurringBaseline, type Transaction } from "../src/lib/types";
import {
  injectBaselines, isSyntheticBaseline, spendingByCategory, dailySpending,
  categoryHabits, detectRecurringStreams, upcomingBills,
} from "../src/lib/analytics";
import { biltEverydaySpend, biltHousingRewards, housingBaseline, statementCycle } from "../src/lib/bilt";
import { isHousingTransaction } from "../src/lib/categories";
import { resolveDetail } from "../src/lib/details";

let sequence = 0;
function transaction(amount: number, fields: Partial<Transaction> = {}): Transaction {
  return {
    id: `housing-${++sequence}`, accountId: "bilt", amount, currency: "USD",
    date: "2026-06-24", name: "Bilt Housing", merchantName: "Bilt Housing",
    pending: false, hidden: false, categoryPrimary: "RENT_AND_UTILITIES",
    categoryDetailed: "RENT_AND_UTILITIES_RENT", paymentChannel: null,
    source: "plaid", userCategory: null, note: null, ...fields,
  };
}
const rent: RecurringBaseline = {
  id: "rent", name: "Rent & Parking", amount: 4100,
  category: "RENT_AND_UTILITIES", startMonth: "2026-01",
};

test("old Bilt history gap explains estimates and imported rent replaces them", () => {
  const history = state([
    transaction(-1000, { date: "2025-11-15", accountId: "checking", categoryPrimary: "INCOME" }),
    transaction(20, { date: "2026-02-07", categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: null, name: "Cafe", merchantName: "Cafe" }),
    transaction(4107.54, { date: "2026-03-02" }),
  ], [{ ...rent, startMonth: "2025-11" }]);
  history.accounts = [{ id: "bilt", itemId: "bilt-item", name: "Bilt Obsidian Card", officialName: null, mask: null, type: "credit", subtype: "credit card", currency: "USD", source: "plaid", balances: { current: 0, available: null, limit: null } }];
  const reconciled = injectBaselines(history);
  const detail = resolveDetail(reconciled, { metric: "spending", part: "estimates", months: ["2025-11", "2025-12", "2026-01", "2026-02"] });
  assert.equal(detail.rows.length, 4);
  assert.equal(detail.summary.find((s) => s.label === "Estimates")?.value, 16400);
  assert.match(detail.notes.join(" "), /Previous Bilt card history is missing/);
  assert.match(detail.notes.join(" "), /2026-02-07.*2026-03-02/);
  assert.equal(detail.rows[0].values.status, "Estimated · no posted charge");
  const record = resolveDetail(reconciled, { metric: "transaction", record: reconciled.transactions.find((t) => isSyntheticBaseline(t) && t.date === "2026-02-01")!.id });
  assert.match(record.notes.join(" "), /not a confirmed payment/);
  const later = estimates(reconciled).find((t) => t.date === "2026-06-01")!;
  assert.doesNotMatch(later.note!, /Previous Bilt/);
  const imported = injectBaselines({ ...history, transactions: [...history.transactions, transaction(4095, { date: "2026-01-02", accountId: "old-bilt", source: "csv" })] });
  assert.equal(estimates(imported).some((t) => t.date === "2026-01-01"), false);
});
function state(transactions: Transaction[], baselines = [rent]): AppState {
  return { ...emptyState(), baselines, transactions: [
    transaction(-1000, { name: "Salary", merchantName: "Employer", categoryPrimary: "INCOME", categoryDetailed: null }),
    ...transactions,
  ] };
}
function estimates(s: AppState) {
  return s.transactions.filter(isSyntheticBaseline);
}
function rentTotal(s: AppState) {
  return spendingByCategory(s, "2026-06").find((c) => c.category === rent.category)?.total ?? 0;
}

test("pending and hidden housing do not suppress the estimate", () => {
  for (const transactions of [
    [transaction(4100, { pending: true })],
    [transaction(4100, { hidden: true })],
  ]) {
    const reconciled = injectBaselines(state(transactions));
    assert.equal(estimates(reconciled).length, 1);
    assert.equal(rentTotal(reconciled), 4100);
  }
});

test("split housing payments suppress one estimate without doubling rent", () => {
  const reconciled = injectBaselines(state([transaction(1500), transaction(1500), transaction(1100)]));
  assert.equal(estimates(reconciled).length, 0);
  assert.equal(rentTotal(reconciled), 4100);
});

test("a prorated housing payment keeps its actual amount", () => {
  const reconciled = injectBaselines(state([transaction(1187.14)]));
  assert.equal(estimates(reconciled).length, 0);
  assert.equal(rentTotal(reconciled), 1187.14);
});

test("utility charges cannot suppress rent and rent cannot suppress storage", () => {
  const storage = { ...rent, id: "storage", name: "Storage Unit", amount: 180 };
  const utilities = transaction(3000, {
    name: "Electric Company", merchantName: "Electric Company",
    categoryDetailed: "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY",
  });
  assert.equal(estimates(injectBaselines(state([utilities]))).length, 1);
  const reconciled = injectBaselines(state([transaction(4100)], [rent, storage]));
  assert.deepEqual(estimates(reconciled).map((t) => t.merchantName), ["Storage Unit"]);
  assert.equal(rentTotal(reconciled), 4280);
});

test("one charge cannot satisfy two same-category bills", () => {
  const other = { ...rent, id: "other", name: "Other Property Rent", amount: 2000 };
  const reconciled = injectBaselines(state([
    transaction(4100, { name: "Rent & Parking", merchantName: "Rent & Parking" }),
  ], [rent, other]));
  assert.deepEqual(estimates(reconciled).map((t) => t.merchantName), ["Other Property Rent"]);
});

test("baseline injection is idempotent and removes obsolete synthetic rows", () => {
  const first = injectBaselines(state([]));
  assert.deepEqual(injectBaselines(first), first);
  assert.equal(estimates(injectBaselines({ ...first, baselines: [] })).length, 0);
  assert.equal(estimates(injectBaselines({ ...first, transactions: [
    ...first.transactions, transaction(4100),
  ] })).length, 0);
});

test("future housing and unrelated utilities do not change the Bilt denominator", () => {
  const future = { ...rent, startMonth: "2027-01" };
  assert.equal(housingBaseline(state([], [future]), "2026-06"), null);
  const utility = { ...rent, id: "utility", name: "Electricity", amount: 80 };
  assert.equal(housingBaseline(state([], [rent, utility]), "2026-06"), 4100);
  const otherRent = { ...rent, id: "other", name: "Other Property Rent" };
  assert.equal(housingBaseline(state([], [rent, otherRent]), "2026-06"), null);
});

test("no housing payment earns no floor points or next-tier amount", () => {
  const reward = biltHousingRewards(100, 0);
  assert.equal(reward.points, 0);
  assert.equal(reward.toNext, null);
  assert.equal(reward.nextMultiplier, null);
});

test("Bilt spend excludes transfers and fees, includes utilities, and subtracts refunds", () => {
  const purchase = (amount: number, fields: Partial<Transaction> = {}) => transaction(amount, {
    name: "Shop", merchantName: "Shop", categoryPrimary: "GENERAL_MERCHANDISE", categoryDetailed: null, ...fields,
  });
  const spend = biltEverydaySpend([
    purchase(100), purchase(-40),
    purchase(500, { categoryPrimary: "TRANSFER_OUT" }),
    purchase(95, { categoryPrimary: "BANK_FEES" }),
    purchase(80, { name: "Electric Company", categoryPrimary: "RENT_AND_UTILITIES", categoryDetailed: "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY" }),
    transaction(4100), purchase(50, { pending: true }),
  ], "bilt", statementCycle("2026-06-29", 23));
  assert.equal(spend, 140);
});

test("housing matching excludes vehicle and party rentals", () => {
  assert.equal(isHousingTransaction(transaction(100, { name: "Rent a car", merchantName: null, categoryDetailed: null })), false);
  assert.equal(isHousingTransaction(transaction(100, { name: "Enterprise Rent-A-Car", merchantName: null, categoryDetailed: null })), false);
  assert.equal(isHousingTransaction(transaction(100, { name: "Party rental", merchantName: null, categoryDetailed: null })), false);
  assert.equal(isHousingTransaction(transaction(100)), true);
  assert.equal(isHousingTransaction(transaction(100, { userCategory: "TRAVEL" })), false);
});

test("pace uses elapsed days and does not multiply fixed housing", () => {
  const reconciled = injectBaselines(state([
    transaction(100, { name: "Shop", merchantName: "Shop", date: "2026-06-02", categoryPrimary: "GENERAL_MERCHANDISE", categoryDetailed: null }),
  ]));
  const pace = dailySpending(reconciled, "2026-06", "2026-06-20");
  assert.equal(pace.throughDay, 20);
  assert.equal(pace.projected, 4250);
  assert.equal(pace.avgPerDay, 210);
  const historical = dailySpending(reconciled, "2026-06", "2026-10-13");
  assert.equal(historical.throughDay, 30);
  assert.equal(historical.avgPerDay, 140);
  assert.equal(historical.projected, null);
});

test("empty spending habits stay zero", () => {
  assert.deepEqual(categoryHabits(emptyState()), { habits: [], months: 0, avgMonthlyTotal: 0 });
});

test("repeated refunds never become recurring income", () => {
  const s = state(["08", "09", "10"].map((month) => transaction(-10, {
    date: `2026-${month}-01`, name: "Shop Refund", merchantName: "Shop",
    categoryPrimary: "GENERAL_MERCHANDISE", categoryDetailed: null,
  })), []);
  assert.equal(detectRecurringStreams(s, "2026-10-13").length, 0);
});

test("weekly bills include all occurrences due in 30 days", () => {
  const s = emptyState();
  s.recurring = [{
    id: "weekly", accountId: "a", description: "Weekly Bill", merchantName: "Bill",
    categoryPrimary: "GENERAL_SERVICES", frequency: "WEEKLY", averageAmount: 10,
    lastAmount: 10, firstDate: "2026-01-01", lastDate: "2026-10-12",
    predictedNextDate: "2026-10-19", isActive: true, type: "outflow", source: "plaid",
  }];
  const upcoming = upcomingBills(s, "2026-10-13", 30);
  assert.equal(upcoming.dueSoonTotal, 40);
  assert.equal(upcoming.bills.length, 4);
  assert.equal(new Set(upcoming.bills.map((b) => b.id)).size, 4);
});

test("month-end bills clamp February and retain the original due day", () => {
  const s = emptyState();
  s.recurring = [{
    id: "monthly", accountId: "a", description: "Monthly Bill", merchantName: "Bill",
    categoryPrimary: "GENERAL_SERVICES", frequency: "MONTHLY", averageAmount: 10,
    lastAmount: 10, firstDate: "2026-01-31", lastDate: "2026-01-31",
    predictedNextDate: null, isActive: true, type: "outflow", source: "plaid",
  }];
  assert.deepEqual(upcomingBills(s, "2026-02-01", 60).bills.map((b) => b.nextDate), ["2026-02-28", "2026-03-31"]);
});

test("a refund in the next month never adds a second bill to the purchase month", () => {
  const s = state([transaction(4100), transaction(-4100, { date: "2026-07-02" })]);
  const result = injectBaselines(s);
  assert.equal(estimates(result).filter((t) => t.date.startsWith("2026-06")).length, 0);
  assert.equal(rentTotal(result), 4100);
});

test("Bilt housing uses the shared end-month timeline without reviving old rent", () => {
  const s = state([], [rent, { ...rent, id: "new", startMonth: "2026-03", endMonth: "2026-08" }]);
  assert.equal(housingBaseline(s, "2026-08"), 4100);
  assert.equal(housingBaseline(s, "2026-09"), null);
});


test("a posted bill and refund never trigger an additional estimate", () => {
  const result = injectBaselines(state([transaction(4100), transaction(-4100, { date: "2026-06-25" })]));
  assert.equal(estimates(result).length, 0);
  assert.equal(rentTotal(result), 0);
});

test("a prior-month duplicate refund cannot cause an estimated rent top-up", () => {
  const result = injectBaselines(state([
    transaction(4100, { date: "2026-06-01" }),
    transaction(4100, { date: "2026-06-02" }),
    transaction(4100, { date: "2026-07-01" }),
    transaction(-4100, { date: "2026-07-03" }),
  ]));
  assert.equal(estimates(result).length, 0);
  const total = spendingByCategory(result).find((c) => c.category === rent.category)?.total;
  assert.equal(total, 8200);
});
