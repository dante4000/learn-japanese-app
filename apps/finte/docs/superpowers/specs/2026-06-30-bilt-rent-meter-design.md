# Bilt Rent Multiplier Meter — Design

**Date:** 2026-06-30
**Branch:** `feat/bilt-rent-meter`

## Problem

The Bilt Card 2.0 (launched Feb 2026) "Housing-only" rewards option scales the
points you earn on rent/mortgage by your **Everyday Spend Ratio** — the ratio of
your everyday (non-housing) card spend to your monthly housing payment, measured
*per statement cycle*. To earn the maximum **1.25×** on rent you'd be paying
anyway, you must route enough everyday purchases through the Bilt card before the
statement closes. There's no nudge in this app today, so it's easy to leave rent
points on the table.

This adds an Overview tile that mirrors the Bilt app's "Estimated housing
rewards" screen: it shows how much everyday Bilt spend has posted this cycle and
how far you are from the next multiplier tier.

## Mechanic (ground truth)

Confirmed by the user's live Bilt app screenshot and corroborating sources
(The Points Guy, Bilt Rewards support, NerdWallet). Ratio `r = everydaySpend /
housingPayment`:

| Ratio `r` | Rent multiplier |
| --- | --- |
| `r < 0.25` | floor only (flat **250 pts**) |
| `0.25 ≤ r < 0.50` | 0.5× |
| `0.50 ≤ r < 0.75` | 0.75× |
| `0.75 ≤ r < 1.00` | 1.0× |
| `r ≥ 1.00` | **1.25× (max)** |

Notes:
- **Per billing cycle.** The ratio resets every statement period and can change
  month to month.
- **Floor.** Below 25% you still earn a flat 250 points on the housing payment.
- **Dilution past 100%.** Spending beyond the housing amount does not raise the
  rate — the sweet spot is everyday spend ≈ housing payment. The tile surfaces a
  gentle "maxed — extra everyday spend won't add rent points" note at `r ≥ 1`.

Screenshot sanity check: housing `$4,100`, everyday `$663.47` → `r ≈ 0.162` →
floor (250 pts); 25% threshold is `$1,025`, so `$1,025 − $663.47 = $361.53` to
0.5× — matches the app exactly.

## Inputs & data sources

1. **Housing payment** (denominator) — prefilled from the user's
   `RENT_AND_UTILITIES` recurring baseline ($4,100), overridable via a
   pencil-edit that persists. Mirrors Bilt's editable field.
2. **Everyday spend** (numerator) — sum of **outflow** transactions on the Bilt
   account, **excluding** the rent/housing category, within the current
   statement cycle. Bilt account is matched by `matchHints: ["bilt"]` (same
   logic the Cards tab uses).
3. **Statement cycle** — a configurable **start-day** (default **23rd**), so the
   cycle runs e.g. Jun 23 – Jul 22 (ends the day before the next start-day).
   Stored with the override.

## Architecture

### Pure logic — `src/lib/bilt.ts`
- `biltHousingRewards(everydaySpend: number, housingPayment: number)` →
  `{ multiplier, tier, nextTier, toNext, ratio, maxed, points }`.
  - `multiplier`: 0 (floor) | 0.5 | 0.75 | 1.0 | 1.25.
  - `points`: `multiplier === 0 ? 250 : Math.round(housingPayment * multiplier)`.
  - `nextTier`/`toNext`: next ratio threshold and dollars of everyday spend to
    reach it; `null` once maxed.
  - `maxed`: `ratio >= 1`.
- `statementCycle(today: string, startDay: number)` → `{ start, end, label }`
  ISO bounds for the cycle containing `today`: `start` is the most recent
  `startDay`-of-month on/before `today`; `end` is the day before the next
  `startDay` (inclusive).
- `biltEverydaySpend(state, account, cycle)` → sum of qualifying outflows.

No React, no I/O — fully unit-testable. `today` is injectable for tests.

### Persistence — `MetaDoc.biltConfig`
```ts
interface BiltConfig {
  housingOverride?: number; // dollars; falls back to rent baseline when unset
  statementDay: number;     // cycle START day-of-month, 1–28, default 23
}
```
Add optional `biltConfig?: BiltConfig` to `MetaDoc`. New API route
`src/app/api/bilt/route.ts` (POST to save, mirrors `/api/baseline`): validates
`statementDay ∈ [1,28]` and `housingOverride > 0` when present.

### UI
- `src/components/BiltRentMeter.tsx` — the tile: big multiplier, housing amount
  with pencil, "Everyday spend" vs. "Housing rewards", a segmented progress bar
  with tier ticks at 25/50/75/100%, and the "$X away from N× on housing" line.
  Pencil opens a small client editor (housing amount + statement close-day) that
  POSTs to the API route and refreshes.
- Mounted in `src/app/(app)/page.tsx` Overview, after the hero section.

## Graceful degradation
- **No Bilt account** connected → tile shows a one-line prompt ("Connect your
  Bilt card to track rent rewards") instead of wrong numbers.
- **No housing amount** (no baseline and no override) → prompt to set rent /
  enter a housing payment via the pencil.

## Testing — `tests/bilt-rewards.test.ts`
Tier boundaries on `biltHousingRewards`:
- `r = 0.249` → floor / 250 pts
- `r = 0.25` → 0.5×
- `r = 0.50` → 0.75×, `r = 0.75` → 1.0×
- `r = 0.999` → 1.0×, `r = 1.0` → 1.25× maxed
- `r = 1.5` → 1.25×, `maxed = true`, `toNext = null`
- Screenshot case: `(663.47, 4100)` → multiplier 0, `toNext = 361.53` to 0.5×.
- `statementCycle` boundaries: a date on the close-day, day after, month/year
  rollover (e.g. Dec→Jan), and Feb with `closeDay = 23`.

## Out of scope (YAGNI)
- The 4% Bilt-Cash alternative option (mutually exclusive; not modeled).
- Palladium/Blue tier-specific differences — Obsidian behavior only.
- Historical multiplier charting; this is the current cycle only.
