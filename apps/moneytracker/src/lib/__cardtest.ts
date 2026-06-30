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

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
