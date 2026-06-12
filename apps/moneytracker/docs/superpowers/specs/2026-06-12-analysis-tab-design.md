# Analysis Tab — Design

**Date:** 2026-06-12
**Status:** Approved (pending spec review)

## Goal

A new **Analysis** tab in moneytracker that shows exactly where and how the user
spends *and* makes money over a rolling 12-month window. The existing Spending
tab stays as-is for single-month category drill-down; Analysis is the
big-picture view covering both sides of the ledger.

## Architecture

Follows the app's established pattern end to end:

- **Derivations:** pure functions over `AppState` in a new file
  `src/lib/insights.ts`. `analytics.ts` (295 lines) stays focused on what it
  has; the only change there is exporting the existing `isSpend` and `isIncome`
  helpers so `insights.ts` shares the exact same inclusion rules (excludes
  hidden, pending, and transfer-category transactions — consistent with the
  recent Recurring fix).
- **Page:** server component `src/app/(app)/analysis/page.tsx` with
  `export const dynamic = "force-dynamic"`, calling `loadState()` at request
  time like every other page.
- **Nav:** new "Analysis" item in `AppShell.tsx` `NAV`, between Spending and
  Activity, with an SVG path icon in the existing style.
- **Charts:** reuse `CashFlowBars`, `StatCard`, `SectionCard`, `PageHeading`,
  `EmptyState`. One new presentational component:
  `src/components/charts/WeekdayBars.tsx` (7 vertical bars, house chart style).

No new dependencies, no client-side data fetching, no schema changes.

## Page sections (top to bottom)

### 1. Hero stats

Four `StatCard`s over the last 12 available months:

- Total income
- Total spending
- Net saved (income − spending)
- Savings rate (net / income, as %; "—" when income is 0)

### 2. Cash flow

- `CashFlowBars` of monthly income vs. spending (12 months).
- Per-month savings rate beneath or beside the bars.
- Callouts: best month (highest net) and worst month (lowest net), with
  amounts.

### 3. Where money comes from (income sources)

Inflow transactions grouped by `merchantName || name`:

- total over the window, monthly average, payment count, share of total income
- inferred cadence from median gap between payment dates: ~weekly (5–9 days),
  ~biweekly (10–18), ~monthly (19–45), otherwise "irregular"; single payment =
  "one-time"
- rendered as a sorted bar list (same visual pattern as the Spending category
  list)

### 4. How you spend (behavior patterns)

- `WeekdayBars`: total spending by day of week (Mon–Sun) over the window.
- Stats: average transaction size, total transaction count.
- Top 5 largest single purchases in the window (date, merchant, category,
  amount).

### 5. What's changing (trends)

- Per-category trend: average monthly spend over the last 3 available months
  vs. the prior months in the window. Sorted by absolute dollar change,
  rendered as "▲/▼ Category +/-N%" rows with the two monthly-average amounts.
  Categories with prior average of $0 (brand-new) show "new" instead of a %.
- New merchants: merchants whose first-ever transaction falls in the last 3
  available months, with total spent at each.

## Derivations in `src/lib/insights.ts`

All take `AppState` (plus optional `monthsBack = 12`) and operate on the last N
*available* months (per `availableMonths`), so sandbox/imported data that isn't
from the current calendar month still works.

- `overview(state, monthsBack)` → `{ income, spending, net, savingsRate, months }`
- `incomeSources(state, monthsBack)` → `[{ name, total, monthlyAvg, count, share, cadence }]`
- `spendByWeekday(state, monthsBack)` → `[{ weekday, total, count }]` (length 7)
- `largestPurchases(state, monthsBack, limit = 5)` → `Transaction[]`
- `categoryTrends(state, monthsBack)` → `[{ category, label, color, glyph, recentAvg, priorAvg, deltaPct | null }]`
- `newMerchants(state, monthsBack, recentMonths = 3)` → `[{ name, total, count, firstDate }]`

## Edge cases

- **No data at all:** standard `EmptyState`.
- **Accounts but no transactions:** the same "no spending recorded yet" card
  the Spending page uses.
- **Fewer than 4 available months:** hide the "What's changing" section
  entirely (a 3-vs-prior split needs at least 4 months to mean anything).
- **Zero income in window:** savings rate shows "—"; income sources section
  shows an inline empty message instead of an empty list.
- Hidden, pending, and transfer-category transactions are excluded everywhere
  via the shared `isSpend`/`isIncome` rules.

## Testing / verification

The repo has no automated test setup. Verification = `next build` passes +
manual check of every section against real synced data, including the
empty-state path (e.g. by temporarily pointing at an empty state).
