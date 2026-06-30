# Period-Accurate, Robust Credit Tracking — Design

**Date:** 2026-06-29
**App:** apps/moneytracker — `/cards` Credit Cards tab
**Status:** Approved (design), pending implementation plan

## Problem

The `/cards` tab tracks each card's statement credits, but the usage view is
shallow and partly wrong:

1. **Wrong "current period."** `detectCreditUsage` anchors the current
   month/quarter/half to the latest **transaction** date (`latestDate(state)`),
   not real today. When a card synced a few days ago and the period has since
   rolled over, it shows the stale period as current (still "June used" when
   July's fresh $10 is what's actually waiting).
2. **No whole-year picture.** You only ever see the *current* period's single
   checkbox. You can't see `Q1 ✓ Q2 ✓ Q3 ✗ Q4 ✗` or a Jan–Dec strip at a glance.
3. **Captured-$ conflates periods.** It's one trailing-12-month number capped at
   the annual value, so it can't say "you've banked $60 of $120 across 6 months,
   6 slots still open."
4. **No per-period deadline.** Nothing says "this month's $25 expires in 1 day."
5. **Fragile detection.** Naive `includes()` substring matching over a merchant
   haystack causes real false positives in the current catalog (e.g. `apple` →
   **Applebee's**, `max` → **CarMax**, `clear` → **Clearwater**) and an Uber ride
   can tick both Uber Cash *and* Uber One.

The user's ask: a tracker that resets correctly per period (twice-a-year credits
check off per half, quarterly per quarter), is **super robust** in what it
detects, and is presented so it's instantly obvious what's used and what isn't.

## Decisions (locked during brainstorming)

1. **Layout:** per-credit **slot tracker** (a filled/empty cell per reset period)
   **plus** a top **"Use it or lose it" action banner** listing only what's still
   open in the current period, sorted by deadline.
2. **Corrections:** **tap any individual slot** to toggle it. A manual slot
   override beats detection for that one slot only.
3. **Inferred (enrollment-required) credits:** when we see qualifying **spend**
   but **no** matching statement-credit posting, **do not tick** the slot — show a
   "you spent here — did the credit post?" nudge. It does **not** count as captured
   until the user confirms (taps it) or a posting later appears. This is the
   conservative/robust choice: never claim an enrollment credit was captured
   without proof.

## Detection model — layered + evidence-based

Detection is the heart of this work. It runs per credit, per slot, over the
linked account's posted transactions (reusing `isSpend` / `refundMatchedIds`).

### Signal 1 — statement-credit *posting* (authoritative → `confirmed`)

The strongest proof a credit was captured is the issuer's own reimbursement line:
an **inflow** (`amount < 0`) whose descriptor names the benefit — e.g.
`AMEX RESY CREDIT`, `UBER CASH`, `DIGITAL ENTERTAINMENT CREDIT`, `TRAVEL CREDIT`,
`EXCLUSIVE TABLES`. Matched via each credit's `creditPostHints`.

- A posting match in a slot's window → slot is **confirmed used**.
- `captured` for that slot = the actual credited amount, capped at the slot value.
- Immune to merchant-name noise; works even for enrollment-required credits.

Today only Exclusive Tables uses `creditPostHints`. **This design expands posting
descriptors to every detectable credit** (researched from real Amex/Chase
statement descriptors — see "Hint audit & research").

### Signal 2 — qualifying *spend* (`inferred`, or `flagged`)

When no posting is found, fall back to spend at the triggering merchant
(`detectHints`) within the slot window:

- Credit has **`autoApplies: true`** → slot is **inferred used** (the credit
  auto-applies to that spend; reliable). Counts as captured. Rendered with a
  hollow-check to distinguish from confirmed.
- Credit has **`enrollmentRequired: true`** → slot is **flagged**, *not* used:
  spend exists but we can't prove the credit posted. Shows the "did it post?"
  nudge. Does **not** count as captured (per Decision 3).

### Dedup (no double-counting)

Within a slot, a **posting wins**: if a posting is found we use the posted amount
and ignore the spend-derived figure, so the Resy charge *and* the Resy credit
never both count.

### Token-boundary matching (kills false positives)

Replace `haystack.includes(hint)` with **tokenized matching**:

- Lowercase the haystack (`merchantName + name + categoryPrimary + categoryDetailed`),
  split into alphanumeric tokens (`/[a-z0-9]+/g`).
- A hint matches only as a **consecutive whole-token sequence**. Single-word hints
  must equal a token; multi-word hints (`uber one`, `fine hotels`, `amex travel`)
  must appear as consecutive tokens.

This fixes current catalog false positives:

| Hint | Naive `includes` wrongly matches | Tokenized result |
|---|---|---|
| `apple` | **Applebee's** → Apple TV credit | `applebee` ≠ token `apple` → skip |
| `max` | **CarMax**, T.J.Maxx → streaming | `carmax` ≠ `max` → skip |
| `clear` | **Clearwater** → CLEAR Plus | `clearwater` ≠ `clear` → skip |
| `uber` (ride) | also ticks **Uber One** | most-specific hint wins (below) |

Note: Apple charges post as `APPLE.COM/BILL`, `Apple Music`, `Apple TV` — all
tokenize to include `apple`, so real matches survive. Where a real merchant has no
separator (rare), the posting descriptor (Signal 1) covers it.

### Single attribution per transaction (per card)

For a given card, each transaction is attributed to **at most one** credit — the
one whose **matched hint is longest / most specific**. A `uber one` membership
charge matches both `uber` (Uber Cash) and `uber one` (Uber One) → attributed to
Uber One. A plain Uber ride matches only `uber` → Uber Cash. This is computed once
per card, not per credit, so credits never compete-and-double-count.

### Confidence states (surfaced in UI)

| State | Trigger | Counts as captured? | Render |
|---|---|---|---|
| `confirmed` | posting match | yes | solid ✓ (blue) |
| `inferred` | spend match, `autoApplies` | yes | hollow ✓ (blue) |
| `flagged` | spend match, `enrollmentRequired`, no posting | **no** | open + "did it post?" nudge |
| `open` | no match, slot window started | no | hollow ○ (coral if past = missed) |
| `future` | slot window not started | no | dim · |

Each used slot records *why*: `"confirmed · statement credit"` or
`"inferred · Resy $112 on Jun 12"`, so the user can trust or one-tap correct it.

### Anchor fix

All slot-window and "current period" math anchors to **real today** (injectable
`todayISO`, default `new Date()`), exactly like `detectRenewal`. Transactions are
bucketed into slots purely by their own `date`, so a June charge lands in June
regardless of which row is newest.

## Data model (`src/lib/cards.ts`)

### Slot enumeration

For a credit's frequency and `todayISO`, enumerate the **current calendar year's**
reset slots:

| Frequency | Slots | Per-slot value |
|---|---|---|
| `monthly` | Jan…Dec (12) | `value / 12` |
| `quarterly` | Q1…Q4 | `value / 4` |
| `semiannual` | H1, H2 | `value / 2` |
| `annual` | one (the year) | `value` |
| `every-4-years` | one (trailing 48 mo) | `value` |
| `one-time` | one ("ever") | `value` |

```ts
export type SlotStatus = "past" | "current" | "future";
export type SlotConfidence = "confirmed" | "inferred" | "flagged" | "open" | "future";

export interface CreditSlot {
  key: string;            // "2026-06" | "2026-Q2" | "2026-H1" | "2026" | "ever"
  label: string;          // "Jun" | "Q2" | "H1" | "2026"
  start: string;          // yyyy-mm-dd inclusive
  end: string;            // yyyy-mm-dd inclusive
  value: number;          // per-slot dollar value
  status: SlotStatus;     // relative to todayISO
  used: boolean;          // confirmed || inferred (NOT flagged)
  confidence: SlotConfidence;
  captured: number;       // dollars captured in this slot, capped at value
  daysLeft: number | null;// end − today (current slot only; else null)
  lastDate: string | null;
  matchedMerchant: string | null;
  evidence: string | null;// "confirmed · statement credit" | "inferred · Resy $112 Jun 12"
}
```

### `CreditUsage` (reworked, back-compat preserved)

```ts
export interface CreditUsage {
  creditName: string;
  detectable: boolean;     // has detectHints or creditPostHints
  frequency: CreditFrequency;
  perSlotValue: number;
  slots: CreditSlot[];
  currentSlot: CreditSlot | null;   // slot containing today
  capturedYtd: number;     // Σ captured (detection-only) over started slots; overrides layered in the component
  availableToDate: number; // Σ value over slots with status past|current
  // ── back-compat (consumed by existing code paths) ──
  usedThisPeriod: boolean; // currentSlot?.used ?? false
  periodLabel: string;     // currentSlot?.label ?? year
  captured: number;        // = capturedYtd (kept for existing callers)
  periodSpend: number;     // currentSlot?.captured ?? 0
  count12mo: number;
  lastDate: string | null;
  matchedMerchant: string | null;
}
```

`detectCreditUsage(state, accountId, card, todayISO?)` returns one `CreditUsage`
per credit, in catalog order. Detection itself is override-agnostic (pure from
transactions); overrides are layered in the component.

## Captured-$ semantics

Two distinct numbers, each used where it's honest:

- **Grid + banner (exact truth):** `capturedYtd` = Σ of each started slot's
  captured amount (override-aware in the component). `availableToDate` =
  Σ value of slots whose window has started. The slot grid's "$X captured of $Y"
  uses these, so it never reads near-zero just because it's January.
- **Leaderboard annual net-value verdict (stable):** project the full year =
  `capturedYtd + Σ (realisticCaptureRate × value)` over slots **not yet started**.
  i.e. what you've actually banked plus a realistic estimate of the remaining
  slots. Keeps the keep/drop verdict from swinging wildly through the year. UI
  labels it "captured so far + projected." `maxCredits` stays the annual sticker.

## Per-slot manual override

`STORAGE_KEY` → `mt.cardperks.v4`. Shape:

```ts
type OverrideMap = Record<string /*cardKey*/,
  Record<string /*creditName*/,
    Record<string /*slotKey*/, boolean>>>;
```

- A slot's displayed state: explicit override for `(card, credit, slotKey)` wins;
  else detection's `used`.
- Tapping a slot sets an explicit override to the opposite of what's shown; a
  small "manual · auto" affordance reverts that one slot to detection.
- Old `v3` overrides are not migrated (sparse corrections; cheap to re-tick).
  `v3` key left untouched.

## UI (`src/components/CreditCardsView.tsx`)

### Action banner — "Use it or lose it · {period}"

Above the leaderboard. Aggregates across **linked** cards every credit whose
**current slot** is open (state `open` or `flagged`, and not overridden-used).
Each line: per-slot `$value` · credit name · card · current period label ·
**days left** until the slot closes. Sorted by `daysLeft` ascending.

- Urgency: `daysLeft ≤ 3` → coral with `!`; `≤ 7` → amber; else neutral.
- `flagged` lines read "did the credit post?" instead of plain "unused."
- Hidden entirely when nothing is open.

### Slot grid — in each card's Credits tab

Replaces the single current-period chip. Per credit:

- **monthly:** 12 compact cells `J F M … D`.
- **quarterly:** 4 pills `Q1 Q2 Q3 Q4`.
- **semiannual:** 2 pills `H1 H2` (each shows per-half $).
- **annual / one-time / every-4-years:** single pill.

Cell visual by `confidence`: `confirmed` solid ✓, `inferred` hollow ✓, `flagged`
amber dot, `open` past = faint coral ○ (missed money) / current = ringed ○,
`future` = dim `·`. Current slot always ringed. Each cell is tappable (override).

Below the strip: `"$X captured of $Y this year"` + current-slot status line
(`"June unused — $10 waiting · 1 day left"` / `"Confirmed · statement credit"` /
`"You spent at Resy — did the $100 credit post?"`). Existing `howToUse` text and
badges (`enroll`, `easy to forget`, `detected`) stay.

Non-detectable credits (no hints at all): grid shown but driven purely by manual
taps, with a quiet "auto-detection off — tap to track" note.

## Hint audit & research

Per-credit pass over all ~30 credits in `CARD_CATALOG`:

1. **Tighten every dangerous `detectHints`** (audit for short/ambiguous tokens
   now that matching is token-based — confirm none rely on substring behavior).
2. **Add `creditPostHints`** with the real statement-credit descriptors for each
   detectable credit (Amex Platinum, CSR, Blue Cash Preferred especially). This is
   the deep-research portion: descriptors are issuer- and benefit-specific and
   must be sourced, not guessed. Where a reliable descriptor can't be confirmed,
   the credit falls back to Signal 2 behavior (and enrollment-required ones to
   `flagged`), never to a wrong posting hint.

## Edge cases

- **Stale data across a period boundary:** anchoring to real today means July's
  slot becomes current on Jul 1 even if the newest transaction is June 28 — the
  banner correctly shows July's fresh slot as open.
- **Mid-period today:** `daysLeft` = slot `end` − today; a credit used earlier in
  the slot shows `used` and is excluded from the banner.
- **Dec Uber bump ($35):** per-slot value stays the flat monthly figure; capture
  is capped per slot, so a larger December credit simply caps at the slot value.
  (Modeling the Dec bump precisely is out of scope.)
- **`every-4-years` / `one-time`:** single slot; `daysLeft` null; never in the
  "this period" banner urgency.
- **Unlinked cards:** no live detection; grid renders future/open from the
  catalog only, manual taps still work; not in the banner.

## Out of scope (YAGNI)

- Push/calendar reminders or notifications.
- Modeling the Amex Uber December $35 bump exactly.
- Multi-year slot history (only the current calendar year is shown).
- Server-side persistence of overrides (stays in localStorage, single-user app).
- Changing the points-estimation model (`estimatePointsDetailed` untouched).

## Verification

No test framework is configured in this app. Verification is:

1. `npm run lint` and `npm run build` clean.
2. A temporary, self-contained Node script exercising the new pure functions
   (`creditSlots`, tokenized matcher, `detectCreditUsage`) against hand-built
   transaction fixtures covering: posting → confirmed; autoApplies spend →
   inferred; enrollment spend → flagged; token false-positive rejection
   (Applebee's/CarMax/Clearwater); single-attribution (Uber ride vs Uber One);
   period roll-over with stale data; quarterly/semiannual slot boundaries.
   Removed after it passes (no test runner to host it).
3. Manual smoke of `/cards` against real data.
