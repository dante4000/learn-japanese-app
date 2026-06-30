# Period-Accurate, Robust Credit Tracking — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/cards` statement-credit tracking reset correctly per period, detect usage robustly (posting-confirmed → spend-inferred → enrollment-flagged) with token-boundary matching, and present used/unused at a glance via a per-credit slot grid + a "use it or lose it" action banner.

**Architecture:** All detection logic lives in `src/lib/cards.ts` as pure functions anchored to real today. `detectCreditUsage` returns a per-credit array of `CreditSlot`s (one per reset period of the current calendar year) with a confidence state. `src/components/CreditCardsView.tsx` renders a per-slot grid (tap to override, stored in localStorage v4) and an aggregate action banner. `page.tsx` is unchanged except passing through.

**Tech Stack:** Next.js 16 (App Router, RSC), React client component, TypeScript 5, Tailwind. No test runner is configured; pure functions are verified with a temporary `npx tsx` harness that is deleted in the final task.

## Global Constraints

- **Commit author email MUST be `daniel.clxxx@gmail.com`** (Vercel git-author verification blocks other authors). Commit with `git -c user.email=daniel.clxxx@gmail.com -c user.name=dante4000 commit`.
- **No new dependencies.**
- **Pure detection functions** take an injectable `todayISO: string = new Date().toISOString().slice(0, 10)` and must not otherwise read the clock — mirrors `detectRenewal`.
- **Plaid sign convention:** `transaction.amount` POSITIVE = money out (spend), NEGATIVE = money in (inflow / statement credit).
- **Dates are `yyyy-mm-dd` strings**; fixed-width so lexical comparison equals chronological.
- **Currency formatting** via `formatMoney(amount, currency, { cents: false })` from `@/lib/format`.
- Run the harness with `npx tsx src/lib/__cardtest.ts` from `apps/moneytracker`.

---

### Task 1: Token-boundary matcher

**Files:**
- Modify: `src/lib/cards.ts` (add exported helpers near the existing `ruleMatches`, ~line 952)
- Test: `src/lib/__cardtest.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export function tokenize(s: string): string[]`
  - `export function bestHintMatchLen(tokens: string[], hints: string[]): number`

- [ ] **Step 1: Write the failing test** — create `src/lib/__cardtest.ts`:

```ts
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

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/lib/__cardtest.ts`
Expected: FAIL — `tokenize`/`bestHintMatchLen` not exported (import error).

- [ ] **Step 3: Write minimal implementation** — add to `src/lib/cards.ts` just above `function ruleMatches`:

```ts
// ── token-boundary matching ──────────────────────────────────────────────────
// Naive substring matching causes false positives ("apple" → "Applebee's",
// "max" → "CarMax", "clear" → "Clearwater"). We tokenize into alphanumeric runs
// and match hints as consecutive whole-token sequences instead.

/** Lowercased alphanumeric tokens of a string. */
export function tokenize(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

/** True when `hintToks` appears as a consecutive run inside `toks`. */
function tokensContain(toks: string[], hintToks: string[]): boolean {
  if (hintToks.length === 0) return false;
  for (let i = 0; i + hintToks.length <= toks.length; i++) {
    let ok = true;
    for (let j = 0; j < hintToks.length; j++) {
      if (toks[i + j] !== hintToks[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/**
 * Length (in joined characters) of the LONGEST hint that matches `tokens` as a
 * whole-token sequence, else 0. Used both as a yes/no match (>0) and to pick the
 * most-specific credit when several could claim one transaction.
 */
export function bestHintMatchLen(tokens: string[], hints: string[]): number {
  let best = 0;
  for (const h of hints) {
    const ht = tokenize(h);
    if (tokensContain(tokens, ht)) {
      const len = ht.join("").length;
      if (len > best) best = len;
    }
  }
  return best;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx src/lib/__cardtest.ts`
Expected: `ALL PASS`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cards.ts src/lib/__cardtest.ts
git -c user.email=daniel.clxxx@gmail.com -c user.name=dante4000 commit -m "feat(moneytracker): token-boundary hint matcher for credit detection"
```

---

### Task 2: Slot enumeration

**Files:**
- Modify: `src/lib/cards.ts` (add types + `creditSlots` near `creditPeriod`, ~line 1157)
- Test: `src/lib/__cardtest.ts` (append)

**Interfaces:**
- Consumes: existing `CreditFrequency`, `daysBetween` (defined later in file — fine, function hoisting), `monthsBefore`.
- Produces:
  - `export type SlotStatus = "past" | "current" | "future";`
  - `export type SlotConfidence = "confirmed" | "inferred" | "flagged" | "open" | "future";`
  - `export interface CreditSlot { key, label, start, end, value, status, used, confidence, captured, daysLeft, lastDate, matchedMerchant, evidence }` (full shape below)
  - `export function creditSlots(freq: CreditFrequency, value: number, todayISO: string): CreditSlot[]` — returns slots with detection fields zeroed (`used:false`, `confidence:"open"|"future"`, `captured:0`, `lastDate:null`, `matchedMerchant:null`, `evidence:null`).

- [ ] **Step 1: Write the failing test** — append to `src/lib/__cardtest.ts` (before the final summary lines; move the summary/`process.exit` to the very end):

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/lib/__cardtest.ts`
Expected: FAIL — `creditSlots` not exported.

- [ ] **Step 3: Write minimal implementation** — add to `src/lib/cards.ts` directly after the existing `creditPeriod` function (keep `creditPeriod`; it is still used by back-compat fields). Note `daysBetween` is declared later in the file but is a function declaration, so it is hoisted.

```ts
export type SlotStatus = "past" | "current" | "future";
export type SlotConfidence =
  | "confirmed"
  | "inferred"
  | "flagged"
  | "open"
  | "future";

export interface CreditSlot {
  /** Stable id: "2026-06" | "2026-Q2" | "2026-H1" | "2026" | "every4" | "ever". */
  key: string;
  /** Short display label: "Jun" | "Q2" | "H1" | "2026" | "4 yrs" | "ever". */
  label: string;
  start: string; // yyyy-mm-dd inclusive
  end: string; // yyyy-mm-dd inclusive
  /** Per-slot dollar value (annual value split across the period count). */
  value: number;
  status: SlotStatus;
  /** confirmed || inferred. flagged/open/future are NOT used. */
  used: boolean;
  confidence: SlotConfidence;
  /** Dollars captured in this slot, capped at `value`. */
  captured: number;
  /** Whole days from today to `end`, current slot only (else null). */
  daysLeft: number | null;
  lastDate: string | null;
  matchedMerchant: string | null;
  /** Why it's marked, e.g. "confirmed · statement credit". */
  evidence: string | null;
}

/** Last calendar day of `month1` (1–12) in `year`, as a number. */
function lastDayOfMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/** Build a zeroed slot (no detection applied yet). */
function blankSlot(
  key: string,
  label: string,
  start: string,
  end: string,
  value: number,
  todayISO: string,
  hasDeadline: boolean,
): CreditSlot {
  const status: SlotStatus =
    todayISO < start ? "future" : todayISO > end ? "past" : "current";
  return {
    key,
    label,
    start,
    end,
    value,
    status,
    used: false,
    confidence: status === "future" ? "future" : "open",
    captured: 0,
    daysLeft:
      status === "current" && hasDeadline ? daysBetween(todayISO, end) : null,
    lastDate: null,
    matchedMerchant: null,
    evidence: null,
  };
}

/**
 * Enumerate the reset slots for one credit across the CURRENT calendar year,
 * anchored to `todayISO`. Detection fields are zeroed; `detectCreditUsage`
 * fills them in. monthly→12, quarterly→4, semiannual→2, annual/one-time/
 * every-4-years→1.
 */
export function creditSlots(
  freq: CreditFrequency,
  value: number,
  todayISO: string,
): CreditSlot[] {
  const year = Number(todayISO.slice(0, 4));
  const y = String(year);
  const pad = (n: number) => String(n).padStart(2, "0");

  switch (freq) {
    case "monthly":
      return Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        return blankSlot(
          `${y}-${pad(m)}`,
          MONTH_ABBR[i],
          `${y}-${pad(m)}-01`,
          `${y}-${pad(m)}-${pad(lastDayOfMonth(year, m))}`,
          value / 12,
          todayISO,
          true,
        );
      });
    case "quarterly":
      return Array.from({ length: 4 }, (_, q) => {
        const sm = q * 3 + 1;
        const em = q * 3 + 3;
        return blankSlot(
          `${y}-Q${q + 1}`,
          `Q${q + 1}`,
          `${y}-${pad(sm)}-01`,
          `${y}-${pad(em)}-${pad(lastDayOfMonth(year, em))}`,
          value / 4,
          todayISO,
          true,
        );
      });
    case "semiannual":
      return [
        blankSlot(`${y}-H1`, "H1", `${y}-01-01`, `${y}-06-30`, value / 2, todayISO, true),
        blankSlot(`${y}-H2`, "H2", `${y}-07-01`, `${y}-12-31`, value / 2, todayISO, true),
      ];
    case "every-4-years":
      return [
        blankSlot("every4", "4 yrs", monthsBefore(todayISO, 48), todayISO, value, todayISO, false),
      ];
    case "one-time":
      return [blankSlot("ever", "ever", "0000-01-01", "9999-12-31", value, todayISO, false)];
    case "annual":
    default:
      return [blankSlot(y, y, `${y}-01-01`, `${y}-12-31`, value, todayISO, true)];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx src/lib/__cardtest.ts`
Expected: `ALL PASS`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cards.ts src/lib/__cardtest.ts
git -c user.email=daniel.clxxx@gmail.com -c user.name=dante4000 commit -m "feat(moneytracker): per-period credit slot enumeration"
```

---

### Task 3: Per-slot detection (`detectCreditUsage` rework)

**Files:**
- Modify: `src/lib/cards.ts` — replace `CreditUsage` interface (~line 1132) and `detectCreditUsage` (~line 1195). Keep `creditPeriod` (used for back-compat label) and `MONTH_ABBR`.
- Test: `src/lib/__cardtest.ts` (append)

**Interfaces:**
- Consumes: `tokenize`, `bestHintMatchLen`, `creditSlots`, `CreditSlot`, `SlotConfidence`, existing `isSpend`, `refundMatchedIds`, `latestDate` (still used? no — switch to todayISO), `AppState`, `Transaction`, `CardCatalogEntry`, `CardCredit`.
- Produces:
  - Reworked `export interface CreditUsage` (fields below).
  - `export function detectCreditUsage(state: AppState, accountId: string, card: CardCatalogEntry, todayISO?: string): CreditUsage[]`

- [ ] **Step 1: Write the failing test** — append to `src/lib/__cardtest.ts`. This builds a minimal `AppState`-like object and a one-card catalog entry inline.

```ts
import { detectCreditUsage } from "./cards";
import type { AppState, Transaction } from "./types";
import type { CardCatalogEntry } from "./cards";

function txn(p: Partial<Transaction>): Transaction {
  return {
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
    ...(p as Transaction),
  } as Transaction;
}

function stateOf(txns: Transaction[]): AppState {
  return { accounts: [], transactions: txns } as unknown as AppState;
}

// A synthetic card with three credits exercising each confidence path.
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

// 5. Token false-positive: "Applebee's" must not tick anything with an apple-like hint
//    (covered structurally by Task 1; here ensure Resy hint ignores 'nursery' etc.)
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx src/lib/__cardtest.ts`
Expected: FAIL — reworked `detectCreditUsage` not present (type/shape mismatch).

- [ ] **Step 3: Write minimal implementation** — replace the `CreditUsage` interface and the whole `detectCreditUsage` function body in `src/lib/cards.ts` with:

```ts
export interface CreditUsage {
  creditName: string;
  /** False when the credit carries no detectHints and no creditPostHints. */
  detectable: boolean;
  frequency: CreditFrequency;
  /** Per-slot dollar value. */
  perSlotValue: number;
  /** One slot per reset period of the current calendar year, in order. */
  slots: CreditSlot[];
  /** The slot whose window contains today, or null. */
  currentSlot: CreditSlot | null;
  /** Σ captured over slots whose window has started (detection-only). */
  capturedYtd: number;
  /** Σ value over slots whose window has started. */
  availableToDate: number;

  // ── back-compat fields consumed by existing UI code ──
  /** currentSlot?.used ?? false */
  usedThisPeriod: boolean;
  /** currentSlot?.label ?? year */
  periodLabel: string;
  /** = capturedYtd (existing callers read `captured`). */
  captured: number;
  /** currentSlot?.captured ?? 0 */
  periodSpend: number;
  /** Matching transactions across all slots. */
  count12mo: number;
  lastDate: string | null;
  matchedMerchant: string | null;
}

/**
 * Detect, per credit on a card, which reset slots have been tapped — using a
 * layered, evidence-based model:
 *   1. statement-credit POSTING (inflow) matched by creditPostHints → confirmed
 *   2. qualifying SPEND (outflow) matched by detectHints:
 *        - autoApplies credit  → inferred (counts)
 *        - enrollmentRequired  → flagged (does NOT count until confirmed)
 * Matching is token-boundary (no substring false positives) and each transaction
 * is attributed to at most ONE credit per card (longest matched hint wins), so an
 * Uber ride never ticks Uber One. Anchored to real today; pure. A posting wins
 * within a slot (no double-count of the charge and its credit).
 */
export function detectCreditUsage(
  state: AppState,
  accountId: string,
  card: CardCatalogEntry,
  todayISO: string = new Date().toISOString().slice(0, 10),
): CreditUsage[] {
  const neutralized = refundMatchedIds(state);
  const live = state.transactions.filter(
    (t) => t.accountId === accountId && !t.hidden && !t.pending && !neutralized.has(t.id),
  );
  const hay = (t: Transaction) =>
    tokenize(`${t.merchantName ?? ""} ${t.name} ${t.categoryPrimary} ${t.categoryDetailed ?? ""}`);

  // Pre-tokenize and split into spend (outflow) and posting (inflow) pools.
  const spendPool = live
    .filter((t) => isSpend(t, neutralized))
    .map((t) => ({ t, toks: hay(t) }));
  const postPool = live
    .filter((t) => t.amount < 0)
    .map((t) => ({ t, toks: hay(t) }));

  // Single attribution: for a transaction, the index of the credit whose hint
  // matched longest, or -1. `pick` is the per-credit hint accessor.
  const attribute = (
    toks: string[],
    pick: (c: CardCredit) => string[] | undefined,
  ): number => {
    let bestIdx = -1;
    let bestLen = 0;
    card.credits.forEach((c, i) => {
      const len = bestHintMatchLen(toks, pick(c) ?? []);
      if (len > bestLen) {
        bestLen = len;
        bestIdx = i;
      }
    });
    return bestIdx;
  };

  // Build slots per credit, then fold transactions in.
  const perCredit = card.credits.map((credit) => ({
    credit,
    slots: creditSlots(credit.frequency, credit.value, todayISO),
    count: 0,
    lastDate: null as string | null,
    matchedMerchant: null as string | null,
    hasPostingInSlot: new Set<string>(),
  }));

  const slotFor = (slots: CreditSlot[], date: string): CreditSlot | undefined =>
    slots.find((s) => date >= s.start && date <= s.end);

  // Pass 1 — postings (authoritative). amount is negative; magnitude = -amount.
  for (const { t, toks } of postPool) {
    const idx = attribute(toks, (c) => c.creditPostHints);
    if (idx < 0) continue;
    const pc = perCredit[idx];
    const slot = slotFor(pc.slots, t.date);
    if (!slot) continue;
    const mag = -t.amount;
    slot.confidence = "confirmed";
    slot.used = true;
    slot.captured = Math.min(slot.value, slot.captured + mag);
    slot.evidence = "confirmed · statement credit";
    pc.hasPostingInSlot.add(slot.key);
    pc.count++;
    if (!pc.lastDate || t.date > pc.lastDate) {
      pc.lastDate = t.date;
      pc.matchedMerchant = t.merchantName ?? t.name;
    }
    if (!slot.lastDate || t.date > slot.lastDate) {
      slot.lastDate = t.date;
      slot.matchedMerchant = t.merchantName ?? t.name;
    }
  }

  // Pass 2 — spend (inferred / flagged), skipping slots already confirmed.
  for (const { t, toks } of spendPool) {
    const idx = attribute(toks, (c) => c.detectHints);
    if (idx < 0) continue;
    const pc = perCredit[idx];
    const slot = slotFor(pc.slots, t.date);
    if (!slot || pc.hasPostingInSlot.has(slot.key)) continue;
    pc.count++;
    if (!pc.lastDate || t.date > pc.lastDate) {
      pc.lastDate = t.date;
      pc.matchedMerchant = t.merchantName ?? t.name;
    }
    const merch = t.merchantName ?? t.name;
    if (pc.credit.autoApplies) {
      slot.confidence = "inferred";
      slot.used = true;
      slot.captured = Math.min(slot.value, slot.captured + t.amount);
      slot.evidence = `inferred · ${merch}`;
      if (!slot.lastDate || t.date > slot.lastDate) {
        slot.lastDate = t.date;
        slot.matchedMerchant = merch;
      }
    } else {
      // enrollment-required, spend only → flag, do NOT mark used/captured.
      if (slot.confidence === "open") slot.confidence = "flagged";
      slot.evidence = `you spent at ${merch} — did the credit post?`;
      if (!slot.lastDate || t.date > slot.lastDate) {
        slot.lastDate = t.date;
        slot.matchedMerchant = merch;
      }
    }
  }

  return perCredit.map(({ credit, slots, count, lastDate, matchedMerchant }) => {
    const detectable =
      (credit.detectHints?.length ?? 0) > 0 || (credit.creditPostHints?.length ?? 0) > 0;
    const started = slots.filter((s) => s.status !== "future");
    const capturedYtd = started.reduce((a, s) => a + s.captured, 0);
    const availableToDate = started.reduce((a, s) => a + s.value, 0);
    const currentSlot = slots.find((s) => s.status === "current") ?? null;
    return {
      creditName: credit.name,
      detectable,
      frequency: credit.frequency,
      perSlotValue: slots[0]?.value ?? credit.value,
      slots,
      currentSlot,
      capturedYtd,
      availableToDate,
      usedThisPeriod: currentSlot?.used ?? false,
      periodLabel: currentSlot?.label ?? todayISO.slice(0, 4),
      captured: capturedYtd,
      periodSpend: currentSlot?.captured ?? 0,
      count12mo: count,
      lastDate,
      matchedMerchant,
    };
  });
}
```

Note: `latestDate` may now be unused by this function but remains used by `cardSpend`/`cardSpendTxns` — do not remove it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx src/lib/__cardtest.ts`
Expected: `ALL PASS`.

- [ ] **Step 5: Verify the whole app still type-checks**

Run: `npm run build`
Expected: build succeeds (the new `CreditUsage` shape keeps every field the component reads today).

- [ ] **Step 6: Commit**

```bash
git add src/lib/cards.ts src/lib/__cardtest.ts
git -c user.email=daniel.clxxx@gmail.com -c user.name=dante4000 commit -m "feat(moneytracker): evidence-based per-slot credit detection"
```

---

### Task 4: Catalog hint audit + statement-credit posting descriptors

**Files:**
- Modify: `src/lib/cards.ts` — the `CARD_CATALOG` credit entries (lines ~163–469 for CSR & Amex Platinum, plus Blue Cash Preferred ~769).

**Interfaces:**
- Consumes: `CardCredit.creditPostHints` (already on the type), `CardCredit.detectHints`.
- Produces: no new symbols — data only.

This is the deep-research task. For every credit with `enrollmentRequired: true` or whose triggering charge is ambiguous, add `creditPostHints` with the issuer's real statement-credit descriptor so detection can reach `confirmed` (and so enrollment credits aren't stuck at `flagged`).

- [ ] **Step 1: Research real statement-credit descriptors**

Use WebSearch / the card's issuer pages and reporting (NerdWallet, TPG, Doctor of Credit, Reddit r/amex threads on "statement descriptor"). For each credit below, confirm how the *credit line* (the inflow) reads on the statement. Record findings briefly in the commit body.

Starting set (best-known; verify, correct, or drop each — never ship a guess that could false-match):

| Card | Credit | Candidate `creditPostHints` |
|---|---|---|
| Amex Platinum | Resy dining | `["resy credit", "resy"]` |
| Amex Platinum | Uber Cash | `["uber cash"]` |
| Amex Platinum | Digital entertainment | `["digital entertainment credit"]` |
| Amex Platinum | lululemon | `["lululemon credit"]` |
| Amex Platinum | Airline incidental | `["airline fee reimbursement", "airline fee credit"]` |
| Amex Platinum | Equinox | `["equinox credit"]` |
| Amex Platinum | Walmart+ | `["walmart credit"]` |
| Amex Platinum | CLEAR Plus | `["clear credit", "clearme credit"]` |
| Amex Platinum | Saks | `["saks credit", "saks fifth"]` |
| Amex Platinum | Hotel (FHR/THC) | `["travel credit", "fine hotels"]` |
| Amex Platinum | Uber One | `["uber one"]` |
| Amex Platinum | Oura | `["oura credit"]` |
| CSR | Exclusive Tables | `["exclusive tables"]` (already present — keep) |
| CSR | DoorDash promo | `["doordash credit"]` |
| CSR | StubHub / viagogo | `["stubhub credit", "viagogo credit"]` |
| CSR | Apple TV+/Music | `["apple credit"]` |
| Blue Cash Preferred | Disney streaming | `["disney bundle credit", "disney streaming credit"]` |

- [ ] **Step 2: Audit existing `detectHints` for token-safety**

Now that matching is token-based, re-read every `detectHints` array in the catalog. Confirm each entry is a clean token sequence (e.g. `apple.com/bill` is fine — tokenizes to `apple com bill`; `max` would only match a standalone `max` token, acceptable for streaming but verify no card relies on substring). No change is required unless an entry was depending on substring behavior — note any you tighten.

- [ ] **Step 3: Apply the verified hints**

Edit each credit object to add the confirmed `creditPostHints`. Example (CSR Apple credit, ~line 263):

```ts
      {
        name: "Apple TV+ & Apple Music",
        value: 288,
        frequency: "annual",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "Complimentary Apple TV+ and Apple Music through mid-2027. One-time activation per service.",
        realisticCaptureRate: 0.5,
        detectHints: ["apple.com/bill", "apple tv", "apple music"],
        creditPostHints: ["apple credit"],
      },
```

Apply the analogous one-line `creditPostHints` addition to each credit confirmed in Step 1.

- [ ] **Step 4: Re-run detection tests + build**

Run: `npx tsx src/lib/__cardtest.ts && npm run build`
Expected: `ALL PASS` and a clean build (the synthetic test card is independent of catalog edits; this confirms no syntax/type regressions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cards.ts
git -c user.email=daniel.clxxx@gmail.com -c user.name=dante4000 commit -m "feat(moneytracker): statement-credit posting descriptors for confirmed detection

Researched real issuer credit-line descriptors per credit; sources in PR notes."
```

---

### Task 5: Component plumbing — per-slot overrides (v4) + captured/ROI semantics

**Files:**
- Modify: `src/components/CreditCardsView.tsx` — `CardLive` type (~line 27), `STORAGE_KEY`/`OverrideMap` (~line 59), the override helpers (`detected`/`isUsed`/`toggle`/`clearOverride`/`captured`, ~lines 213–271), and `rows` ROI wiring (~line 276).

**Interfaces:**
- Consumes: `CreditUsage`, `CreditSlot` (import from `@/lib/cards`), `CardCatalogEntry`, `computeCardRoi`.
- Produces (within the component, used by Tasks 6–7):
  - `type OverrideMap = Record<string, Record<string, Record<string, boolean>>>` (card → credit → slotKey → bool)
  - `usageFor(cardKey, creditName): CreditUsage | undefined`
  - `slotUsed(cardKey, creditName, slot: CreditSlot): boolean` — override wins, else `slot.used`
  - `toggleSlot(cardKey, creditName, slotKey: string, shown: boolean): void`
  - `clearSlotOverride(cardKey, creditName, slotKey: string): void`
  - `capturedForCard(card): number` — override-aware YTD captured
  - `projectedCapturedForCard(card): number` — YTD + remaining slots × realisticCaptureRate

- [ ] **Step 1: Update imports + types**

In the import from `@/lib/cards`, add `CreditSlot`. Change the override constant + type:

```ts
const STORAGE_KEY = "mt.cardperks.v4";

// card → credit → slotKey → explicit user override (true = used, false = not).
// Absent slot → follows detection.
type OverrideMap = Record<string, Record<string, Record<string, boolean>>>;
```

- [ ] **Step 2: Replace the override helpers**

Replace `detected`, `isUsed`, `isOverridden`, `toggle`, `clearOverride`, and `captured` (lines ~213–271) with:

```ts
  // The full usage record for one credit on a card, if linked.
  function usageFor(cardKey: string, creditName: string): CreditUsage | undefined {
    const live = cards.find((c) => c.card.cardKey === cardKey)?.live;
    return live?.creditUsage.find((u) => u.creditName === creditName);
  }

  // A slot's shown state: explicit per-slot override wins; else detection.
  function slotUsed(cardKey: string, creditName: string, slot: CreditSlot): boolean {
    const ov = overrides[cardKey]?.[creditName]?.[slot.key];
    if (ov !== undefined) return ov;
    return slot.used;
  }

  function slotOverridden(cardKey: string, creditName: string, slotKey: string): boolean {
    return overrides[cardKey]?.[creditName]?.[slotKey] !== undefined;
  }

  // Toggle one slot to the opposite of what's shown now (derive from `prev`).
  function toggleSlot(cardKey: string, creditName: string, slot: CreditSlot) {
    setOverrides((prev) => {
      const cur = prev[cardKey]?.[creditName]?.[slot.key];
      const shown = cur !== undefined ? cur : slot.used;
      const next: OverrideMap = {
        ...prev,
        [cardKey]: {
          ...prev[cardKey],
          [creditName]: { ...prev[cardKey]?.[creditName], [slot.key]: !shown },
        },
      };
      persist(next);
      return next;
    });
  }

  // Revert one slot to auto-detection.
  function clearSlotOverride(cardKey: string, creditName: string, slotKey: string) {
    setOverrides((prev) => {
      const credit = { ...(prev[cardKey]?.[creditName] ?? {}) };
      delete credit[slotKey];
      const next: OverrideMap = {
        ...prev,
        [cardKey]: { ...prev[cardKey], [creditName]: credit },
      };
      persist(next);
      return next;
    });
  }

  // Captured-so-far this year (exact), override-aware. For credits with no live
  // slots (unlinked), fall back to the realistic-capture heuristic.
  function capturedForCard(card: CardCatalogEntry): number {
    return card.credits.reduce((sum, c) => {
      const u = usageFor(card.cardKey, c.name);
      if (!u) return sum + (c.realisticCaptureRate >= 0.5 ? c.value : 0);
      const started = u.slots.filter((s) => s.status !== "future");
      const got = started.reduce((a, s) => {
        const used = slotUsed(card.cardKey, c.name, s);
        // A manual tick captures the full slot value; detection already capped.
        if (slotOverridden(card.cardKey, c.name, s.key)) return a + (used ? s.value : 0);
        return a + s.captured;
      }, 0);
      return sum + got;
    }, 0);
  }

  // Full-year projection for the stable ROI verdict: captured-so-far plus a
  // realistic estimate of slots that haven't started yet.
  function projectedCapturedForCard(card: CardCatalogEntry): number {
    return card.credits.reduce((sum, c) => {
      const u = usageFor(card.cardKey, c.name);
      if (!u) return sum + c.value * c.realisticCaptureRate;
      const future = u.slots.filter((s) => s.status === "future");
      const remaining = future.reduce((a, s) => a + s.value * c.realisticCaptureRate, 0);
      return sum + remaining;
    }, capturedForCard(card));
  }
```

Note the second `reduce` seeds its accumulator with `capturedForCard(card)` — confirm that's the second argument.

- [ ] **Step 3: Wire ROI + totals to the new functions**

In the `rows` useMemo (~line 277), change the captured value and add per-slot unused detection:

```ts
    const scored = cards.map(({ card, live, renewal }) => {
      const cap = capturedForCard(card);
      const roi = computeCardRoi(card, {
        capturedCredits: projectedCapturedForCard(card),
        estPoints: live?.estPoints ?? 0,
        hasLiveSpend: !!live,
      });
      // Forgettable credits whose CURRENT slot is still open (open or flagged).
      const openNow = card.credits.filter((c) => {
        if (!isForgettable(c.frequency)) return false;
        const u = usageFor(card.cardKey, c.name);
        const cur = u?.currentSlot;
        if (!cur) return false;
        return !slotUsed(card.cardKey, c.name, cur);
      });
      return { card, live, renewal, roi, cap, unusedForgettable: openNow };
    });
```

In `totals` (~line 312), replace `creditsCaptured += captured(card)` with `creditsCaptured += capturedForCard(card)`. Leave the `eslint-disable` deps comments as-is.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: clean. (`LeaderboardRow`/`CardDetail` still receive `cap`/`unusedForgettable`; their props are unchanged so far.)

- [ ] **Step 5: Commit**

```bash
git add src/components/CreditCardsView.tsx
git -c user.email=daniel.clxxx@gmail.com -c user.name=dante4000 commit -m "feat(moneytracker): per-slot credit overrides (v4) + YTD/projected captured math"
```

---

### Task 6: Slot grid in the card detail

**Files:**
- Modify: `src/components/CreditCardsView.tsx` — the `CardDetail` Credits tab body (~lines 882–944) and the `CardDetail` prop list (~lines 707–733); add a `SlotGrid` component.

**Interfaces:**
- Consumes: `slotUsed`, `slotOverridden`, `toggleSlot`, `clearSlotOverride`, `usageFor`, `CreditSlot`, `CreditUsage`.
- Produces: `function SlotGrid({...})` presentational component.

- [ ] **Step 1: Pass per-slot callbacks into `CardDetail`**

Replace the `CardDetail` invocation (~line 477) props `used/overridden/onToggle/onClearOverride/detect` with usage-oriented ones:

```tsx
                  <CardDetail
                    card={card}
                    live={live}
                    renewal={renewal}
                    roi={roi}
                    cap={cap}
                    currency={currency}
                    unusedForgettable={unusedForgettable}
                    usage={(name) => usageFor(card.cardKey, name)}
                    slotUsed={(name, slot) => slotUsed(card.cardKey, name, slot)}
                    slotOverridden={(name, key) => slotOverridden(card.cardKey, name, key)}
                    onToggleSlot={(name, slot) => toggleSlot(card.cardKey, name, slot)}
                    onClearSlot={(name, key) => clearSlotOverride(card.cardKey, name, key)}
                  />
```

Update `CardDetail`'s signature/type block accordingly:

```tsx
  usage: (creditName: string) => CreditUsage | undefined;
  slotUsed: (creditName: string, slot: CreditSlot) => boolean;
  slotOverridden: (creditName: string, slotKey: string) => boolean;
  onToggleSlot: (creditName: string, slot: CreditSlot) => void;
  onClearSlot: (creditName: string, slotKey: string) => void;
```

(remove the old `used/overridden/onToggle/onClearOverride/detect` props and their type lines).

- [ ] **Step 2: Replace the Credits tab body**

Replace the `{tab === "credits" && ...}` block (~lines 882–944) with a per-credit card that shows the slot grid:

```tsx
      {tab === "credits" && card.credits.length > 0 && (
        <ul className="space-y-2">
          {card.credits.map((c) => {
            const u = usage(c.name);
            const cur = u?.currentSlot ?? null;
            const curUsed = u && cur ? slotUsed(c.name, cur) : false;
            return (
              <li key={c.name} className="rounded-lg border hairline bg-surface px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm text-cream">{c.name}</span>
                  <span className="tnum text-xs text-blue">
                    {formatMoney(c.value, currency, { cents: false })}
                  </span>
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.6rem] text-faint">
                    {freqLabel(c.frequency)}
                  </span>
                  {isForgettable(c.frequency) && (
                    <span className="rounded bg-coral/15 px-1.5 py-0.5 text-[0.6rem] text-coral">
                      ↻ easy to forget
                    </span>
                  )}
                  {c.enrollmentRequired && (
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.6rem] text-slate">
                      enroll
                    </span>
                  )}
                </div>

                {u ? (
                  <>
                    <SlotGrid
                      slots={u.slots}
                      used={(s) => slotUsed(c.name, s)}
                      overridden={(s) => slotOverridden(c.name, s.key)}
                      onToggle={(s) => onToggleSlot(c.name, s)}
                      onClear={(s) => onClearSlot(c.name, s.key)}
                    />
                    <div className="mt-1.5 text-[0.7rem] text-faint">
                      <span className="text-cream-dim">
                        {formatMoney(capturedThisYear(u, c, slotUsed, slotOverridden), currency, { cents: false })}
                      </span>{" "}
                      captured of {formatMoney(u.availableToDate, currency, { cents: false })} so far
                      {cur && (
                        <>
                          {" · "}
                          {curUsed
                            ? cur.evidence ?? `${cur.label} used`
                            : c.enrollmentRequired && cur.confidence === "flagged"
                              ? cur.evidence ?? `${cur.label} — did the credit post?`
                              : `${cur.label} unused — ${formatMoney(cur.value, currency, { cents: false })} waiting${cur.daysLeft != null ? ` · ${cur.daysLeft}d left` : ""}`}
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-faint">
                    Not linked — reference only. {c.howToUse}
                  </p>
                )}
                {u && <p className="mt-1 text-xs text-faint">{c.howToUse}</p>}
              </li>
            );
          })}
        </ul>
      )}
```

- [ ] **Step 3: Add the `SlotGrid` component + a captured helper**

Add near the other presentational helpers (before `Stat`, ~line 1160):

```tsx
/** Per-slot value captured this year, override-aware (mirrors capturedForCard). */
function capturedThisYear(
  u: CreditUsage,
  c: CardCredit,
  used: (name: string, slot: CreditSlot) => boolean,
  overridden: (name: string, key: string) => boolean,
): number {
  return u.slots
    .filter((s) => s.status !== "future")
    .reduce((a, s) => {
      if (overridden(c.name, s.key)) return a + (used(c.name, s) ? s.value : 0);
      return a + s.captured;
    }, 0);
}

const SLOT_TONE: Record<string, string> = {
  confirmed: "border-blue bg-blue text-ink",
  inferred: "border-blue/60 bg-blue/15 text-blue",
  flagged: "border-amber-400/50 bg-amber-400/10 text-amber-400",
  open: "border-line-2 text-faint",
  future: "border-transparent bg-surface-2 text-faint/50",
};

/**
 * A tappable strip of period slots for one credit. Each slot is a button that
 * toggles a manual override (tap again, then "auto" to revert). Confirmed = solid
 * check, inferred = hollow check, flagged = "?", open current = ring, past open =
 * coral (missed), future = dim.
 */
function SlotGrid({
  slots,
  used,
  overridden,
  onToggle,
  onClear,
}: {
  slots: CreditSlot[];
  used: (slot: CreditSlot) => boolean;
  overridden: (slot: CreditSlot) => boolean;
  onToggle: (slot: CreditSlot) => void;
  onClear: (slot: CreditSlot) => void;
}) {
  const many = slots.length > 6; // monthly → compact cells
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {slots.map((s) => {
        const on = used(s);
        const ov = overridden(s);
        const isPastOpen = !on && s.status === "past" && s.confidence !== "flagged";
        const tone = on
          ? ov
            ? "border-blue bg-blue/80 text-ink"
            : SLOT_TONE[s.confidence] ?? SLOT_TONE.open
          : isPastOpen
            ? "border-coral/40 text-coral"
            : SLOT_TONE[s.confidence] ?? SLOT_TONE.open;
        const glyph = on ? (s.confidence === "inferred" && !ov ? "◔" : "✓") : s.confidence === "flagged" ? "?" : s.label[0];
        return (
          <button
            key={s.key}
            onClick={() => (ov ? onClear(s) : onToggle(s))}
            title={`${s.label}: ${s.evidence ?? (on ? "used" : s.status === "future" ? "upcoming" : "open")}${ov ? " (manual — tap to revert)" : ""}`}
            aria-pressed={on}
            className={`grid place-items-center rounded-md border text-[0.65rem] transition-colors ${
              s.status === "current" ? "ring-1 ring-blue/50" : ""
            } ${tone} ${many ? "h-6 w-6" : "h-7 min-w-[2.4rem] px-2"}`}
          >
            {many ? glyph : `${s.label} ${on ? (s.confidence === "inferred" && !ov ? "◔" : "✓") : s.confidence === "flagged" ? "?" : "○"}`}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: clean. Confirm no unused-import/var warnings for the removed `detect`/`used` props.

- [ ] **Step 5: Commit**

```bash
git add src/components/CreditCardsView.tsx
git -c user.email=daniel.clxxx@gmail.com -c user.name=dante4000 commit -m "feat(moneytracker): tappable per-period slot grid in card detail"
```

---

### Task 7: "Use it or lose it" action banner

**Files:**
- Modify: `src/components/CreditCardsView.tsx` — add an `actionItems` useMemo and render an `ActionBanner` above the toolbar (~before line 398); add the `ActionBanner` component.

**Interfaces:**
- Consumes: `usageFor`, `slotUsed`, `cards`, `currency`, `CreditSlot`.
- Produces: `function ActionBanner({...})`.

- [ ] **Step 1: Compute action items**

Add after the `totals` useMemo (~line 338):

```ts
  // Open current-period slots across linked cards, soonest deadline first.
  const actionItems = useMemo(() => {
    type Item = {
      cardKey: string;
      cardName: string;
      creditName: string;
      value: number;
      label: string;
      daysLeft: number | null;
      flagged: boolean;
    };
    const items: Item[] = [];
    for (const { card, live } of cards) {
      if (!live) continue;
      for (const c of card.credits) {
        const u = usageFor(card.cardKey, c.name);
        const cur = u?.currentSlot;
        if (!u || !cur) continue;
        if (slotUsed(card.cardKey, c.name, cur)) continue;
        items.push({
          cardKey: card.cardKey,
          cardName: card.displayName,
          creditName: c.name,
          value: cur.value,
          label: cur.label,
          daysLeft: cur.daysLeft,
          flagged: cur.confidence === "flagged",
        });
      }
    }
    return items.sort(
      (a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999) || b.value - a.value,
    );
  }, [cards, overrides]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 2: Render the banner**

Immediately after the portfolio summary paragraph (the `<p>` ending ~line 395) and before the toolbar `<div className="sticky ...">`:

```tsx
      {actionItems.length > 0 && (
        <ActionBanner items={actionItems} currency={currency} onJump={setExpanded} />
      )}
```

- [ ] **Step 3: Add the `ActionBanner` component**

Add near the other helpers (after `SlotGrid`):

```tsx
/** Top-of-page "use it or lose it" list of open current-period credits. */
function ActionBanner({
  items,
  currency,
  onJump,
}: {
  items: {
    cardKey: string;
    cardName: string;
    creditName: string;
    value: number;
    label: string;
    daysLeft: number | null;
    flagged: boolean;
  }[];
  currency: string;
  onJump: (cardKey: string) => void;
}) {
  const total = items.reduce((a, i) => a + i.value, 0);
  return (
    <div className="rise mb-5 rounded-2xl border border-coral/25 bg-coral/5 p-4 md:p-5">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-base tracking-tight text-cream">
          Use it or lose it
        </h2>
        <span className="text-xs text-faint">
          {items.length} open · up to{" "}
          <span className="text-coral">{formatMoney(total, currency, { cents: false })}</span>{" "}
          this period
        </span>
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {items.map((i, idx) => {
          const urgent = i.daysLeft != null && i.daysLeft <= 3;
          const soon = i.daysLeft != null && i.daysLeft <= 7;
          const tone = urgent ? "text-coral" : soon ? "text-amber-400" : "text-faint";
          return (
            <li key={`${i.cardKey}-${i.creditName}-${idx}`}>
              <button
                onClick={() => onJump(i.cardKey)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border hairline bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-2/40"
              >
                <span className="min-w-0">
                  <span className="tnum text-sm text-blue">
                    {formatMoney(i.value, currency, { cents: false })}
                  </span>{" "}
                  <span className="text-sm text-cream">{i.creditName}</span>
                  <span className="block truncate text-[0.65rem] text-faint">
                    {i.cardName} · {i.label}
                  </span>
                </span>
                <span className={`shrink-0 text-[0.7rem] ${tone}`}>
                  {i.flagged
                    ? "did it post?"
                    : i.daysLeft == null
                      ? "open"
                      : i.daysLeft <= 0
                        ? "ends today!"
                        : `${i.daysLeft}d left${urgent ? " !" : ""}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/CreditCardsView.tsx
git -c user.email=daniel.clxxx@gmail.com -c user.name=dante4000 commit -m "feat(moneytracker): 'use it or lose it' action banner for open credits"
```

---

### Task 8: Cleanup, final verification, deploy-ready

**Files:**
- Delete: `src/lib/__cardtest.ts`
- Verify: whole app.

- [ ] **Step 1: Final harness run, then delete it**

```bash
npx tsx src/lib/__cardtest.ts
```
Expected: `ALL PASS`. Then:
```bash
git rm src/lib/__cardtest.ts
```

- [ ] **Step 2: Full lint + build**

Run: `npm run lint && npm run build`
Expected: both clean, no warnings referencing `cards.ts` / `CreditCardsView.tsx`.

- [ ] **Step 3: Manual smoke (describe in commit/PR)**

Start `npm run dev`, open `/cards`:
- Action banner lists open current-period credits, soonest deadline first; empty → hidden.
- Expand a card → Credits tab shows a slot grid; current slot is ringed; tap a slot to toggle (turns manual), tap again to revert.
- A confirmed credit shows ✓, an auto-applies inferred shows ◔, an enrollment-only spend shows `?` and is not counted.
- Portfolio "Credits you capture" reflects YTD; net-value verdict is stable.

- [ ] **Step 4: Commit**

```bash
git add -A
git -c user.email=daniel.clxxx@gmail.com -c user.name=dante4000 commit -m "chore(moneytracker): remove temp credit-detection test harness"
```

---

## Self-Review

**Spec coverage:**
- Period anchor fix → Tasks 2–3 (`todayISO` everywhere). ✓
- Per-slot data model → Task 2 (`CreditSlot`, `creditSlots`) + Task 3 (`CreditUsage.slots`). ✓
- Layered detection (confirmed/inferred/flagged) → Task 3. ✓
- Token-boundary matching → Task 1. ✓
- Single attribution → Task 3 (`attribute`). ✓
- Posting-descriptor research → Task 4. ✓
- Per-slot override v4 → Task 5. ✓
- Captured-$ semantics (YTD exact vs projected verdict) → Task 5 (`capturedForCard`/`projectedCapturedForCard`) + Task 6 (`capturedThisYear`). ✓
- Action banner → Task 7. ✓
- Slot grid UI + confidence rendering → Task 6 (`SlotGrid`). ✓
- Hint audit → Task 4 Step 2. ✓
- Verification via tsx harness → Tasks 1–3, deleted Task 8. ✓

**Placeholder scan:** Task 4 uses a *candidate* descriptor table requiring verification — this is genuine research executed during the task, with explicit "verify, correct, or drop; never ship a guess" instruction, not a code placeholder. All code steps contain full code.

**Type consistency:** `CreditUsage` fields (`slots`, `currentSlot`, `capturedYtd`, `availableToDate`, `usedThisPeriod`, `captured`, `detectable`) defined in Task 3 and consumed identically in Tasks 5–7. `CreditSlot` fields (`key`, `label`, `value`, `status`, `used`, `confidence`, `captured`, `daysLeft`, `evidence`) defined Task 2, used Tasks 3/6/7. Override shape (card→credit→slotKey→bool) consistent across Tasks 5–7. `slotUsed`/`toggleSlot`/`clearSlotOverride` signatures match between definition (Task 5) and call sites (Tasks 6–7).
