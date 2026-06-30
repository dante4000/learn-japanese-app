import test from "node:test";
import assert from "node:assert/strict";
import {
  tokenize,
  bestHintMatchLen,
  creditSlots,
  detectCreditUsage,
  CARD_CATALOG,
} from "../src/lib/cards";
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
    categoryPrimary: "GENERAL_MERCHANDISE",
    categoryDetailed: null,
    paymentChannel: null,
    source: "plaid",
    userCategory: null,
    note: null,
    hidden: false,
    ...partial,
  } as Transaction;
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
  } as unknown as AppState;
}

const TODAY = "2026-06-29";
const amexPlat = CARD_CATALOG.find((c) => c.cardKey === "amex-platinum")!;
const csr = CARD_CATALOG.find((c) => c.cardKey === "sapphire-reserve")!;

// ── token-boundary matching ──────────────────────────────────────────────────

test("tokenize splits on non-alphanumerics and lowercases", () => {
  assert.deepEqual(tokenize("APPLE.COM/BILL"), ["apple", "com", "bill"]);
  assert.deepEqual(tokenize("Uber One"), ["uber", "one"]);
});

test("hint matching is whole-token, not substring", () => {
  assert.equal(bestHintMatchLen(tokenize("Applebee's Grill"), ["apple"]), 0);
  assert.equal(bestHintMatchLen(tokenize("CARMAX 0123"), ["max"]), 0);
  assert.equal(bestHintMatchLen(tokenize("Clearwater Pool"), ["clear"]), 0);
  assert.equal(bestHintMatchLen(tokenize("APPLE.COM/BILL"), ["apple"]), 5);
});

test("the longest matching hint wins (uber one over uber)", () => {
  assert.equal(bestHintMatchLen(tokenize("UBER ONE"), ["uber", "uber one"]), 7);
  assert.equal(bestHintMatchLen(tokenize("UBER TRIP help.uber.com"), ["uber", "uber one"]), 4);
});

// ── slot enumeration ─────────────────────────────────────────────────────────

test("quarterly enumerates 4 slots with correct windows/statuses (mid-Q2)", () => {
  const s = creditSlots("quarterly", 400, TODAY);
  assert.equal(s.length, 4);
  assert.deepEqual(s.map((x) => x.label), ["Q1", "Q2", "Q3", "Q4"]);
  assert.equal(s[0].value, 100);
  assert.deepEqual(s.map((x) => x.status), ["past", "current", "future", "future"]);
  assert.deepEqual([s[1].start, s[1].end], ["2026-04-01", "2026-06-30"]);
  assert.equal(s[1].daysLeft, 1); // Jun 29 → Jun 30
  assert.equal(s[0].daysLeft, null);
});

test("monthly enumerates 12 slots; Feb end is non-leap-aware", () => {
  const s = creditSlots("monthly", 120, TODAY);
  assert.equal(s.length, 12);
  assert.equal(s[0].value, 10);
  assert.equal(s[5].status, "current"); // June
  assert.equal(s[4].status, "past");
  assert.equal(s[6].status, "future");
  assert.equal(s[1].end, "2026-02-28");
});

test("semiannual enumerates H1/H2 with half values", () => {
  const s = creditSlots("semiannual", 300, TODAY);
  assert.deepEqual(s.map((x) => x.label), ["H1", "H2"]);
  assert.equal(s[0].value, 150);
  assert.equal(s[0].status, "current");
});

test("annual/one-time/every-4-years collapse to a single slot", () => {
  assert.equal(creditSlots("annual", 300, TODAY).length, 1);
  const e4 = creditSlots("every-4-years", 120, TODAY);
  assert.equal(e4.length, 1);
  assert.equal(e4[0].daysLeft, null);
  assert.equal(creditSlots("one-time", 100, TODAY)[0].label, "ever");
});

// ── layered, evidence-based detection ────────────────────────────────────────

function platUsage(s: AppState, name: string) {
  return detectCreditUsage(s, "acct_1", amexPlat, TODAY).find((u) => u.creditName === name)!;
}

test("a statement-credit posting confirms the slot (Amex Resy)", () => {
  const s = state([tx({ amount: -100, date: "2026-05-02", name: "AMEX RESY CREDIT" })]);
  const u = platUsage(s, "Resy dining credit");
  assert.equal(u.slots[1].confidence, "confirmed"); // Q2
  assert.equal(u.slots[1].used, true);
  assert.equal(u.slots[1].captured, 100);
});

test("spend with no posting is INFERRED used and captured (assume-used-from-spend)", () => {
  // The reimbursement for many credits posts as "nothing" (wallet/in-app/
  // membership), so qualifying spend in the period infers the credit was used.
  const s = state([tx({ amount: 80, date: "2026-05-02", name: "Resy *Some Restaurant" })]);
  const u = platUsage(s, "Resy dining credit");
  assert.equal(u.slots[1].confidence, "inferred"); // Q2
  assert.equal(u.slots[1].used, true);
  assert.equal(u.slots[1].captured, 80); // capped at the $100 quarterly value
});

test("auto-applies spend is INFERRED and captured, capped at the slot value (CSR Lyft $10/mo)", () => {
  const s = state([tx({ amount: 23, date: "2026-06-03", name: "LYFT *RIDE" })]);
  const u = detectCreditUsage(s, "acct_1", csr, TODAY).find((x) => x.creditName === "Lyft credit")!;
  assert.equal(u.slots[5].confidence, "inferred"); // June
  assert.equal(u.slots[5].used, true);
  assert.equal(u.slots[5].captured, 10);
});

test("single attribution: a plain Uber ride does not tick Uber One", () => {
  const s = state([tx({ amount: 30, date: "2026-06-03", name: "UBER TRIP" })]);
  const one = platUsage(s, "Uber One membership");
  assert.equal(one.slots[5].used, false);
});

test("unrelated merchant matches nothing", () => {
  const s = state([tx({ amount: 50, date: "2026-06-03", name: "Nursery Supply" })]);
  const u = platUsage(s, "Resy dining credit");
  assert.equal(u.slots[1].confidence, "open");
});

test("capturedYtd/availableToDate aggregate only started slots", () => {
  const s = state([tx({ amount: 23, date: "2026-06-03", name: "LYFT *RIDE" })]);
  const u = detectCreditUsage(s, "acct_1", csr, TODAY).find((x) => x.creditName === "Lyft credit")!;
  assert.equal(u.availableToDate, 60); // 6 months × $10
  assert.equal(u.capturedYtd, 10);
  assert.equal(u.usedThisPeriod, true);
});

test("period anchors to today, not the latest transaction date", () => {
  // Spend in February only; today is late June → the current slot (June) is open.
  const s = state([tx({ amount: 23, date: "2026-02-10", name: "LYFT *RIDE" })]);
  const u = detectCreditUsage(s, "acct_1", csr, TODAY).find((x) => x.creditName === "Lyft credit")!;
  assert.equal(u.currentSlot?.label, "Jun");
  assert.equal(u.currentSlot?.used, false);
  assert.equal(u.slots[1].used, true); // February still recorded
});
