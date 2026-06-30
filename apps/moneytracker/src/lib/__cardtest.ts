// Temporary verification harness for cards.ts pure functions. Run:
//   npx tsx src/lib/__cardtest.ts
// Deleted in the final task (no test runner is configured).
import { tokenize, bestHintMatchLen } from "./cards";

let failed = 0;
function eq(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g !== w) {
    failed++;
    console.error(`FAIL ${name}\n  got:  ${g}\n  want: ${w}`);
  } else {
    console.log(`ok   ${name}`);
  }
}

// tokenize
eq("tokenize splits on non-alnum", tokenize("APPLE.COM/BILL"), ["apple", "com", "bill"]);
eq("tokenize lowercases", tokenize("Uber One"), ["uber", "one"]);

// bestHintMatchLen: whole-token only
eq("apple does NOT match applebee's", bestHintMatchLen(tokenize("Applebee's Grill"), ["apple"]), 0);
eq("max does NOT match CarMax", bestHintMatchLen(tokenize("CARMAX 0123"), ["max"]), 0);
eq("clear does NOT match Clearwater", bestHintMatchLen(tokenize("Clearwater Pool"), ["clear"]), 0);
eq("apple matches apple.com/bill", bestHintMatchLen(tokenize("APPLE.COM/BILL"), ["apple"]), 5);
eq("multiword uber one matches", bestHintMatchLen(tokenize("UBER ONE membership"), ["uber one"]), 7);
eq("uber one charge: longest of uber/uber one is uber one", bestHintMatchLen(tokenize("UBER ONE"), ["uber", "uber one"]), 7);
eq("plain uber ride: only uber matches", bestHintMatchLen(tokenize("UBER TRIP help.uber.com"), ["uber", "uber one"]), 4);

// ── Task 2: creditSlots ──────────────────────────────────────────────────────
import { creditSlots } from "./cards";

// quarterly: 4 slots, mid-year (Jun 29) → Q2 current, Q1 past, Q3/Q4 future
{
  const s = creditSlots("quarterly", 400, "2026-06-29");
  eq("quarterly slot count", s.length, 4);
  eq("quarterly labels", s.map((x) => x.label), ["Q1", "Q2", "Q3", "Q4"]);
  eq("quarterly per-slot value", s[0].value, 100);
  eq("quarterly statuses", s.map((x) => x.status), ["past", "current", "future", "future"]);
  eq("Q2 window", [s[1].start, s[1].end], ["2026-04-01", "2026-06-30"]);
  eq("Q2 daysLeft (Jun29→Jun30)", s[1].daysLeft, 1);
  eq("past slot daysLeft null", s[0].daysLeft, null);
}

// monthly: 12 slots, Jun current
{
  const s = creditSlots("monthly", 120, "2026-06-29");
  eq("monthly slot count", s.length, 12);
  eq("monthly per-slot value", s[0].value, 10);
  eq("Jun is current", s[5].status, "current");
  eq("May is past", s[4].status, "past");
  eq("Jul is future", s[6].status, "future");
  eq("Feb end (non-leap 2026)", s[1].end, "2026-02-28");
}

// semiannual: H1/H2
{
  const s = creditSlots("semiannual", 300, "2026-06-29");
  eq("semiannual labels", s.map((x) => x.label), ["H1", "H2"]);
  eq("H1 per-slot value", s[0].value, 150);
  eq("H1 current in June", s[0].status, "current");
  eq("H1 window", [s[0].start, s[0].end], ["2026-01-01", "2026-06-30"]);
}

// annual / every-4-years / one-time: single slot, daysLeft null for the last two
{
  eq("annual single slot", creditSlots("annual", 300, "2026-06-29").length, 1);
  const e4 = creditSlots("every-4-years", 120, "2026-06-29");
  eq("every-4-years single slot", e4.length, 1);
  eq("every-4-years daysLeft null", e4[0].daysLeft, null);
  eq("one-time label", creditSlots("one-time", 100, "2026-06-29")[0].label, "ever");
}

// ── Task 3: detectCreditUsage ────────────────────────────────────────────────
import { detectCreditUsage } from "./cards";
import type { AppState, Transaction } from "./types";
import type { CardCatalogEntry } from "./cards";

function txn(p: Partial<Transaction>): Transaction {
  const base = {
    id: Math.random().toString(36).slice(2),
    accountId: "acct1",
    date: "2026-06-10",
    name: "",
    merchantName: null,
    amount: 0,
    categoryPrimary: "GENERAL_MERCHANDISE",
    categoryDetailed: null,
    pending: false,
    hidden: false,
  };
  return { ...base, ...p } as Transaction;
}

function stateOf(txns: Transaction[]): AppState {
  return { accounts: [], transactions: txns } as unknown as AppState;
}

const testCard: CardCatalogEntry = {
  cardKey: "test",
  displayName: "Test",
  issuer: "X",
  network: "X",
  annualFee: 100,
  authorizedUserFee: 0,
  pointProgram: "X",
  cashValueCents: 1,
  transferValueCents: 1,
  pointValueNote: "",
  matchHints: [],
  earnRates: [],
  baseEarn: 1,
  earnModel: [],
  credits: [
    {
      name: "Resy (enroll)",
      value: 400,
      frequency: "quarterly",
      autoApplies: false,
      enrollmentRequired: true,
      howToUse: "",
      realisticCaptureRate: 0.5,
      detectHints: ["resy"],
      creditPostHints: ["resy credit"],
    },
    {
      name: "Lyft (auto)",
      value: 120,
      frequency: "monthly",
      autoApplies: true,
      enrollmentRequired: false,
      howToUse: "",
      realisticCaptureRate: 0.5,
      detectHints: ["lyft"],
    },
    {
      name: "Uber One",
      value: 120,
      frequency: "monthly",
      autoApplies: false,
      enrollmentRequired: true,
      howToUse: "",
      realisticCaptureRate: 0.5,
      detectHints: ["uber one"],
    },
  ],
  perks: [],
  protections: [],
  transferPartners: [],
  highlights: [],
  recentChanges: "",
  sources: [],
  accent: "blue",
};

const today = "2026-06-29";

// 1. Posting → confirmed (Resy credit inflow in Q2)
{
  const st = stateOf([txn({ name: "AMEX RESY CREDIT", amount: -100, date: "2026-05-02" })]);
  const u = detectCreditUsage(st, "acct1", testCard, today).find((x) => x.creditName === "Resy (enroll)")!;
  const q2 = u.slots[1];
  eq("Resy Q2 confirmed", q2.confidence, "confirmed");
  eq("Resy Q2 used", q2.used, true);
  eq("Resy Q2 captured", q2.captured, 100);
}

// 2. Enrollment spend only → flagged, NOT used, NOT captured
{
  const st = stateOf([txn({ name: "Resy *Some Restaurant", amount: 80, date: "2026-05-02" })]);
  const u = detectCreditUsage(st, "acct1", testCard, today).find((x) => x.creditName === "Resy (enroll)")!;
  const q2 = u.slots[1];
  eq("Resy Q2 flagged", q2.confidence, "flagged");
  eq("Resy Q2 not used", q2.used, false);
  eq("Resy Q2 captured 0", q2.captured, 0);
}

// 3. Auto-applies spend → inferred, used, captured (capped at per-slot value 10)
{
  const st = stateOf([txn({ name: "LYFT *RIDE", amount: 23, date: "2026-06-03" })]);
  const u = detectCreditUsage(st, "acct1", testCard, today).find((x) => x.creditName === "Lyft (auto)")!;
  const jun = u.slots[5];
  eq("Lyft Jun inferred", jun.confidence, "inferred");
  eq("Lyft Jun used", jun.used, true);
  eq("Lyft Jun captured capped at 10", jun.captured, 10);
}

// 4. Single attribution: a plain Uber ride must NOT tick Uber One
{
  const st = stateOf([txn({ name: "UBER TRIP", amount: 30, date: "2026-06-03" })]);
  const u = detectCreditUsage(st, "acct1", testCard, today).find((x) => x.creditName === "Uber One")!;
  eq("Uber ride does not tick Uber One", u.slots[5].used, false);
}

// 5. Token false-positive: unrelated merchant must not match
{
  const st = stateOf([txn({ name: "Nursery Supply", amount: 50, date: "2026-06-03" })]);
  const u = detectCreditUsage(st, "acct1", testCard, today).find((x) => x.creditName === "Resy (enroll)")!;
  eq("nursery does not match resy", u.slots[1].confidence, "open");
}

// 6. capturedYtd / availableToDate aggregate started slots only
{
  const st = stateOf([txn({ name: "LYFT *RIDE", amount: 23, date: "2026-06-03" })]);
  const u = detectCreditUsage(st, "acct1", testCard, today).find((x) => x.creditName === "Lyft (auto)")!;
  eq("Lyft availableToDate = 6 months * $10", u.availableToDate, 60);
  eq("Lyft capturedYtd = $10", u.capturedYtd, 10);
  eq("back-compat usedThisPeriod true (June used)", u.usedThisPeriod, true);
}

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
