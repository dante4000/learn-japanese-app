# Credit Card Renewal Countdown + Product-Change Window — Design

**Date:** 2026-06-24
**App:** apps/moneytracker — `/cards` Credit Cards tab
**Status:** Approved (design), pending implementation plan

## Problem

The `/cards` tab tells you what each card costs and what it returns (fee, credits,
points, worth-it verdict), but it never tells you **when the annual fee hits again**.
That renewal date is the moment you have to decide: keep paying, or product-change /
downgrade to a no-annual-fee version to avoid the fee. The tab should surface, per
card, how close renewal is and — as it nears — prompt the product-change option.

## Decisions (locked during brainstorming)

1. **Date source:** auto-detect from the annual-fee charge in Plaid transactions. No
   manual entry, no new persisted storage. Consistent with how the rest of the tab
   derives everything from real spend (`detectCreditUsage`, `cardSpend`).
2. **Indicator:** a countdown ("Renews in 47 days · Apr 12, 2027") with urgency color.
3. **Placement:** a compact chip in each collapsed leaderboard row **and** a fuller
   version in the expanded detail panel.
4. **Product change:** as renewal approaches on a fee card, flag the window to
   product-change/downgrade to a no-fee card to avoid the fee — naming a real target
   where one exists, emphasized when the worth-it verdict is `reconsider`.

## Detection approach

**Name hints first, amount as confirmation.** Scan the linked account's posted
transactions for charges whose description/merchant contains a fee phrase
(`"annual membership fee"`, `"annual fee"`, `"membership fee"`), preferring those whose
amount is near the card's `annualFee` **or** `legacyAnnualFee`. Issuers label these
clearly (the user's CSR charge reads "ANNUAL MEMBERSHIP FEE"), so name-matching is
reliable and the amount check rejects coincidental same-priced purchases.

**Important:** the user's CSR fee charge is still the **legacy $550**, not the current
$795 sticker — so the amount confirmation must accept `legacyAnnualFee` as well as
`annualFee`.

## Components

### 1. `cards.ts` — `detectRenewal(state, accountId, card): RenewalInfo`

Pure function, mirrors `detectCreditUsage` (per-account scan, lowercased haystack).

```ts
export interface RenewalInfo {
  /** False when annualFee === 0, account not linked, or no fee charge found. */
  detected: boolean;
  /** Date of the most recent matched fee charge (yyyy-mm-dd), or null. */
  lastChargeDate: string | null;
  /** Next renewal: the charge's month/day rolled forward to the next date ≥ today. */
  nextRenewal: string | null;
  /** Whole days from real today (new Date()) until nextRenewal, or null. */
  daysUntil: number | null;
  /** The matched charge amount (helps the UI show "$550 fee" accurately). */
  feeAmount: number | null;
}
```

Logic:
- Return `detected:false` immediately when `card.annualFee === 0`.
- Build the account's posted-spend haystack (reuse the `isSpend` / `refundMatchedIds`
  filtering used elsewhere).
- Match candidates by fee-phrase hints; among matches, prefer those whose amount
  equals `annualFee` or `legacyAnnualFee` within ±$1 (issuers post the exact fee; the
  $1 slack only absorbs rounding); if none confirm by amount, fall back to the most
  recent phrase match.
- `lastChargeDate` = most recent candidate's date.
- `nextRenewal` = that date's month/day in whichever year makes it ≥ **real today**
  (`new Date()`), handling the year-boundary roll-forward.
- `daysUntil` = whole days from today to `nextRenewal`.
- No candidate → `detected:false`.

**Countdown anchor is real today** (`new Date()`), not `latestDate(state)`. The
spend windows in the tab anchor to the latest data date, but a renewal countdown is a
real-world clock.

### 2. `cards.ts` — catalog additions

Add to `CardCatalogEntry`:
- `downgradeTo?: { displayName: string; annualFee: number }` — a real no-fee product
  change target, only where one exists:
  - `sapphire-reserve` → `{ "Chase Freedom Unlimited", 0 }`
  - `bilt-mastercard` → `{ "Bilt Blue", 0 }`
  - `amex-blue-cash-preferred` → `{ "Amex Blue Cash Everyday", 0 }`
  - `amex-platinum`, `world-of-hyatt`: omit (no clean no-fee PC) → generic prompt.
- `feeChargeHints?: string[]` — optional per-card override of the default fee phrases,
  for tuning detection. Default: `["annual membership fee", "annual fee", "membership fee"]`.

### 3. `CreditCardsView.tsx` — UI

**Urgency thresholds:** `daysUntil ≤ 30` → coral, `≤ 60` → amber, else neutral.

- **Collapsed leaderboard row:** a compact chip near the verdict pill — `"Renews 47d"` —
  urgency-colored. Shown only for fee cards where `detected`. Hidden for $0-fee cards
  and undetected fee cards.
- **Detail panel (near the existing `feeNote`):** `"Renews in 47 days · Apr 12, 2027"`,
  urgency-colored. When `daysUntil ≤ 60` on a fee card, an actionable line appears:
  - With a target: *"Product-change/downgrade to {downgradeTo.displayName} before then
    to avoid the ${feeAmount ?? annualFee} fee."*
  - Without a target: *"This is your window to cancel or product-change before the
    ${feeAmount ?? annualFee} fee posts."*
  - Emphasized (stronger color/weight) when `roi.verdict === "reconsider"`.
- Detail panel for an undetected fee card: a quiet "Renewal date not detected yet" note.

## Edge cases

- **$0-fee cards** (Freedom Unlimited/Flex, Amazon Prime Visa): no renewal/PC UI at all.
- **Fee card, no detectable charge** (not linked, or fee hasn't posted in the data
  window): no row chip; quiet "not detected yet" note in detail.
- **Last charge > 12 months ago:** anniversary rolls forward to the next future
  occurrence so `daysUntil` is always ≥ 0 for detected cards.
- **Legacy vs current fee:** amount confirmation accepts both `annualFee` and
  `legacyAnnualFee` (covers the user's legacy-$550 CSR).

## No new storage

Everything is derived from the synced transaction set on each render — no localStorage,
no override map. Recomputes automatically on every data sync, consistent with the rest
of the tab.

## Testing

Unit tests for `detectRenewal`:
- Current-fee amount match.
- Legacy-fee amount match (legacy $550 CSR while sticker is $795).
- Anniversary roll-forward across a year boundary (`daysUntil ≥ 0`).
- No fee charge found → `detected:false`.
- `annualFee === 0` → `detected:false` without scanning.
- Phrase-match with no amount confirmation falls back to most recent phrase match.

## Out of scope (YAGNI)

- Manual entry / override of the renewal date.
- Membership-year progress bar (countdown only).
- A "renewing soon" sort/filter (can revisit later).
- Calendar reminders / notifications.
