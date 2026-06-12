# Analysis Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Analysis tab showing where and how the user makes and spends money over a rolling 12-month window — income sources, cash flow/savings rate, behavior patterns, and category trends.

**Architecture:** Pure derivation functions over `AppState` in a new `src/lib/insights.ts` (sharing the exact `isSpend`/`isIncome` inclusion rules with `analytics.ts`), rendered by a server component page `src/app/(app)/analysis/page.tsx`. One new presentational chart (`WeekdayBars`); everything else reuses existing components (`CashFlowBars`, `StatCard`, `SectionCard`, `PageHeading`, `EmptyState`).

**Tech Stack:** Next.js 16 App Router (server components), TypeScript, Tailwind 4. No new dependencies. **No test framework exists in this repo** — each task is verified with `npm run build` (which type-checks) from `apps/moneytracker/`, plus a final manual check in the browser.

**Spec:** `docs/superpowers/specs/2026-06-12-analysis-tab-design.md`

**Working directory for all commands:** `/Users/danielko/dev/sites/apps/moneytracker` (git commands run from anywhere inside the repo; paths in `git add` below are relative to the repo root `/Users/danielko/dev/sites`).

**Conventions you must follow** (read these before writing code):
- `transaction.amount` is **positive = money out, negative = money in** (Plaid convention).
- All money is major units (dollars). Dates are ISO `yyyy-mm-dd` strings.
- A "month" is a `yyyy-mm` key (`monthKey()` from `src/lib/format.ts`).
- The analysis window is the last N **available** months — months that actually have activity (`availableMonths()` from `src/lib/analytics.ts`) — NOT the last N calendar months. This keeps sandbox/imported data meaningful.

---

### Task 1: Export `isSpend` / `isIncome` from analytics.ts

`src/lib/insights.ts` (Task 2) must use the exact same inclusion rules as the rest of the app (excludes hidden, pending, and transfer-category transactions). They're currently module-private.

**Files:**
- Modify: `src/lib/analytics.ts:19-30`

- [ ] **Step 1: Make the two helpers exported**

In `src/lib/analytics.ts`, change the two function declarations (keep bodies and doc comments exactly as they are):

```ts
/** A transaction that should count as discretionary/spending outflow. */
export function isSpend(t: Transaction): boolean {
  if (t.hidden || t.pending) return false;
  if (t.amount <= 0) return false; // inflow
  return !TRANSFER_CATEGORIES.has(effectiveCategory(t));
}

/** A transaction that should count as income (real inflow, not a transfer). */
export function isIncome(t: Transaction): boolean {
  if (t.hidden || t.pending) return false;
  if (t.amount >= 0) return false; // outflow
  return !TRANSFER_CATEGORIES.has(effectiveCategory(t));
}
```

(The only change is adding `export` to each.)

- [ ] **Step 2: Verify the build still passes**

Run: `npm run build`
Expected: build completes with no type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/moneytracker/src/lib/analytics.ts
git commit -m "refactor(moneytracker): export isSpend/isIncome for shared inclusion rules"
```

---

### Task 2: Create `src/lib/insights.ts` with all derivations

**Files:**
- Create: `src/lib/insights.ts`

- [ ] **Step 1: Write the file in full**

```ts
import { AppState, Transaction } from "./types";
import { availableMonths, effectiveCategory, isIncome, isSpend } from "./analytics";
import { categoryMeta } from "./categories";
import { monthKey } from "./format";

// Big-picture derivations for the Analysis tab. Everything operates on the
// last N *available* months (months that actually have activity), so sandbox
// or imported data far from the current calendar month still analyzes cleanly.
// Same sign convention as analytics.ts: amount positive = out, negative = in.

/** The last `monthsBack` months (yyyy-mm) with any activity, oldest → newest. */
export function windowMonths(state: AppState, monthsBack = 12): string[] {
  return availableMonths(state).slice(-monthsBack);
}

function inWindow(months: string[]): (t: Transaction) => boolean {
  const set = new Set(months);
  return (t) => set.has(monthKey(t.date));
}

export interface Overview {
  income: number; // positive total over the window
  spending: number; // positive total over the window
  net: number; // income - spending
  /** net / income as a fraction, or null when there's no income. */
  savingsRate: number | null;
  months: number; // how many months the window actually covers
}

export function overview(state: AppState, monthsBack = 12): Overview {
  const months = windowMonths(state, monthsBack);
  const within = inWindow(months);
  let income = 0;
  let spending = 0;
  for (const t of state.transactions) {
    if (!within(t)) continue;
    if (isSpend(t)) spending += t.amount;
    else if (isIncome(t)) income += -t.amount;
  }
  const net = income - spending;
  return {
    income,
    spending,
    net,
    savingsRate: income > 0 ? net / income : null,
    months: months.length,
  };
}

export type Cadence =
  | "one-time"
  | "~weekly"
  | "~biweekly"
  | "~monthly"
  | "irregular";

/** Median gap in days between consecutive payments → human-readable cadence. */
function inferCadence(dates: string[]): Cadence {
  if (dates.length < 2) return "one-time";
  const sorted = [...dates].sort();
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1] + "T00:00:00").getTime();
    const b = new Date(sorted[i] + "T00:00:00").getTime();
    gaps.push((b - a) / 86_400_000);
  }
  gaps.sort((x, y) => x - y);
  const median = gaps[Math.floor(gaps.length / 2)];
  if (median >= 5 && median <= 9) return "~weekly";
  if (median >= 10 && median <= 18) return "~biweekly";
  if (median >= 19 && median <= 45) return "~monthly";
  return "irregular";
}

export interface IncomeSource {
  name: string;
  total: number;
  monthlyAvg: number;
  count: number;
  share: number; // fraction of all income in the window
  cadence: Cadence;
}

export function incomeSources(
  state: AppState,
  monthsBack = 12,
): IncomeSource[] {
  const months = windowMonths(state, monthsBack);
  const within = inWindow(months);
  const nMonths = months.length || 1;
  const byName = new Map<string, { total: number; dates: string[] }>();
  for (const t of state.transactions) {
    if (!isIncome(t) || !within(t)) continue;
    const name = t.merchantName || t.name || "Unknown";
    const row = byName.get(name) ?? { total: 0, dates: [] };
    row.total += -t.amount;
    row.dates.push(t.date);
    byName.set(name, row);
  }
  const grand = [...byName.values()].reduce((a, r) => a + r.total, 0) || 1;
  return [...byName.entries()]
    .map(([name, r]) => ({
      name,
      total: r.total,
      monthlyAvg: r.total / nMonths,
      count: r.dates.length,
      share: r.total / grand,
      cadence: inferCadence(r.dates),
    }))
    .sort((a, b) => b.total - a.total);
}

export interface WeekdaySpend {
  weekday: string; // "Mon" … "Sun"
  total: number;
  count: number;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function spendByWeekday(
  state: AppState,
  monthsBack = 12,
): WeekdaySpend[] {
  const within = inWindow(windowMonths(state, monthsBack));
  const rows = WEEKDAYS.map((weekday) => ({ weekday, total: 0, count: 0 }));
  for (const t of state.transactions) {
    if (!isSpend(t) || !within(t)) continue;
    const js = new Date(t.date + "T00:00:00").getDay(); // 0 = Sunday
    rows[(js + 6) % 7].total += t.amount; // re-index so 0 = Monday
    rows[(js + 6) % 7].count += 1;
  }
  return rows;
}

export function largestPurchases(
  state: AppState,
  monthsBack = 12,
  limit = 5,
): Transaction[] {
  const within = inWindow(windowMonths(state, monthsBack));
  return state.transactions
    .filter((t) => isSpend(t) && within(t))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export interface CategoryTrend {
  category: string;
  label: string;
  color: string;
  glyph: string;
  recentAvg: number; // avg monthly spend over the last 3 available months
  priorAvg: number; // avg monthly spend over the earlier months in the window
  /** % change recent vs prior, or null when the category is brand-new. */
  deltaPct: number | null;
}

export function categoryTrends(
  state: AppState,
  monthsBack = 12,
): CategoryTrend[] {
  const months = windowMonths(state, monthsBack);
  // A 3-vs-prior split needs at least one prior month to compare against.
  if (months.length < 4) return [];
  const recent = new Set(months.slice(-3));
  const prior = new Set(months.slice(0, -3));
  const acc = new Map<string, { recent: number; prior: number }>();
  for (const t of state.transactions) {
    if (!isSpend(t)) continue;
    const m = monthKey(t.date);
    const bucket = recent.has(m) ? "recent" : prior.has(m) ? "prior" : null;
    if (!bucket) continue;
    const key = effectiveCategory(t);
    const row = acc.get(key) ?? { recent: 0, prior: 0 };
    row[bucket] += t.amount;
    acc.set(key, row);
  }
  return [...acc.entries()]
    .map(([key, r]) => {
      const meta = categoryMeta(key);
      const recentAvg = r.recent / recent.size;
      const priorAvg = r.prior / prior.size;
      return {
        category: key,
        label: meta.label,
        color: meta.color,
        glyph: meta.glyph,
        recentAvg,
        priorAvg,
        deltaPct:
          priorAvg > 0 ? ((recentAvg - priorAvg) / priorAvg) * 100 : null,
      };
    })
    .sort(
      (a, b) =>
        Math.abs(b.recentAvg - b.priorAvg) - Math.abs(a.recentAvg - a.priorAvg),
    );
}

export interface NewMerchant {
  name: string;
  total: number;
  count: number;
  firstDate: string;
}

/**
 * Merchants whose first-ever spend (across ALL history, not just the window)
 * falls within the last `recentMonths` available months.
 */
export function newMerchants(
  state: AppState,
  monthsBack = 12,
  recentMonths = 3,
): NewMerchant[] {
  const months = windowMonths(state, monthsBack);
  // With so little history every merchant would be "new" — meaningless.
  if (months.length <= recentMonths) return [];
  const recent = new Set(months.slice(-recentMonths));
  const byName = new Map<string, NewMerchant>();
  for (const t of state.transactions) {
    if (!isSpend(t)) continue;
    const name = t.merchantName || t.name || "Unknown";
    const row =
      byName.get(name) ?? { name, total: 0, count: 0, firstDate: t.date };
    if (t.date < row.firstDate) row.firstDate = t.date;
    row.total += t.amount;
    row.count += 1;
    byName.set(name, row);
  }
  return [...byName.values()]
    .filter((m) => recent.has(monthKey(m.firstDate)))
    .sort((a, b) => b.total - a.total);
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no type errors.

- [ ] **Step 3: Commit**

```bash
git add apps/moneytracker/src/lib/insights.ts
git commit -m "feat(moneytracker): insight derivations for the Analysis tab"
```

---

### Task 3: Create the `WeekdayBars` chart component

**Files:**
- Create: `src/components/charts/WeekdayBars.tsx`

Style must match `src/components/charts/CashFlowBars.tsx` (flex bars, CSS-variable gradients, native `title` tooltips, faint uppercase labels).

- [ ] **Step 1: Write the file in full**

```tsx
import { WeekdaySpend } from "@/lib/insights";
import { formatMoney } from "@/lib/format";

/** Total spending per day of week — 7 bars in the house chart style. */
export function WeekdayBars({
  data,
  currency = "USD",
}: {
  data: WeekdaySpend[];
  currency?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="flex h-40 items-end justify-between gap-3">
      {data.map((d) => (
        <div key={d.weekday} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-32 w-full items-end justify-center">
            <div
              className="w-full max-w-8 rounded-t-sm transition-all"
              style={{
                height: `${(d.total / max) * 100}%`,
                background:
                  "linear-gradient(180deg, var(--color-coral), var(--color-coral-deep))",
              }}
              title={`${d.weekday}: ${formatMoney(d.total, currency)} · ${d.count}×`}
            />
          </div>
          <span className="text-[0.62rem] uppercase tracking-wider text-faint">
            {d.weekday}
          </span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no type errors. (The component is not yet imported anywhere; that's fine.)

- [ ] **Step 3: Commit**

```bash
git add apps/moneytracker/src/components/charts/WeekdayBars.tsx
git commit -m "feat(moneytracker): WeekdayBars chart for day-of-week spending"
```

---

### Task 4: Create the Analysis page

**Files:**
- Create: `src/app/(app)/analysis/page.tsx`

- [ ] **Step 1: Write the file in full**

```tsx
import { loadState } from "@/lib/store";
import { cashFlowByMonth } from "@/lib/analytics";
import {
  overview,
  incomeSources,
  spendByWeekday,
  largestPurchases,
  categoryTrends,
  newMerchants,
} from "@/lib/insights";
import { categoryMeta } from "@/lib/categories";
import { formatDate, formatMoney, formatMonth } from "@/lib/format";
import { CashFlowBars } from "@/components/charts/CashFlowBars";
import { WeekdayBars } from "@/components/charts/WeekdayBars";
import { EmptyState, PageHeading, SectionCard, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

const SUBTITLE = "Where the money comes from, where it goes, and what's changing.";

export default async function AnalysisPage() {
  const state = await loadState();
  const cur = state.accounts[0]?.currency ?? "USD";

  if (state.accounts.length === 0) {
    return (
      <div>
        <PageHeading title="Analysis" subtitle={SUBTITLE} />
        <EmptyState />
      </div>
    );
  }

  const ov = overview(state, 12);
  if (ov.months === 0) {
    return (
      <div>
        <PageHeading title="Analysis" subtitle={SUBTITLE} />
        <SectionCard>
          <p className="py-10 text-center text-sm text-muted">
            No activity recorded yet. Import a CSV or sync a bank to see your
            money analyzed here.
          </p>
        </SectionCard>
      </div>
    );
  }

  const flows = cashFlowByMonth(state, 12);
  const best = flows.reduce((a, b) => (b.net > a.net ? b : a), flows[0]);
  const worst = flows.reduce((a, b) => (b.net < a.net ? b : a), flows[0]);
  const sources = incomeSources(state, 12);
  const weekdays = spendByWeekday(state, 12);
  const spendCount = weekdays.reduce((a, d) => a + d.count, 0);
  const avgSize = spendCount ? ov.spending / spendCount : 0;
  const biggest = largestPurchases(state, 12, 5);
  const trends = categoryTrends(state, 12);
  const fresh = newMerchants(state, 12, 3);
  const monthsLabel = `last ${ov.months} month${ov.months === 1 ? "" : "s"}`;

  return (
    <div>
      <PageHeading title="Analysis" subtitle={SUBTITLE} />

      {/* 1 · Hero stats */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={`Income · ${monthsLabel}`}
          value={formatMoney(ov.income, cur, { cents: false })}
          accent="blue"
        />
        <StatCard
          label={`Spending · ${monthsLabel}`}
          value={formatMoney(ov.spending, cur, { cents: false })}
          accent="coral"
          delay={60}
        />
        <StatCard
          label="Net saved"
          value={formatMoney(ov.net, cur, { cents: false })}
          accent={ov.net >= 0 ? "blue" : "coral"}
          delay={120}
        />
        <StatCard
          label="Savings rate"
          value={
            ov.savingsRate == null
              ? "—"
              : `${Math.round(ov.savingsRate * 100)}%`
          }
          accent={ov.savingsRate != null && ov.savingsRate >= 0 ? "blue" : "coral"}
          delay={180}
          sub="of income kept"
        />
      </div>

      {/* 2 · Cash flow */}
      <SectionCard title="Cash flow, month by month" delay={200}>
        <CashFlowBars data={flows} currency={cur} />
        <div className="mt-2 flex justify-between gap-3">
          {flows.map((f) => (
            <span
              key={f.month}
              className="tnum flex-1 text-center text-[0.62rem] text-muted"
              title={`${formatMonth(f.month)}: saved ${formatMoney(f.net, cur)}`}
            >
              {f.income > 0 ? `${Math.round((f.net / f.income) * 100)}%` : "—"}
            </span>
          ))}
        </div>
        <p className="mt-1 text-center text-[0.62rem] uppercase tracking-wider text-faint">
          saved per month
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border hairline bg-surface px-3 py-2.5 text-sm">
            <span className="text-muted">Best month · </span>
            <span className="text-cream">{formatMonth(best.month)}</span>
            <span className="tnum float-right text-blue">
              {formatMoney(best.net, cur, { cents: false, sign: true })}
            </span>
          </div>
          <div className="rounded-xl border hairline bg-surface px-3 py-2.5 text-sm">
            <span className="text-muted">Toughest month · </span>
            <span className="text-cream">{formatMonth(worst.month)}</span>
            <span className="tnum float-right text-coral">
              {formatMoney(worst.net, cur, { cents: false, sign: true })}
            </span>
          </div>
        </div>
      </SectionCard>

      {/* 3 · Income sources */}
      <SectionCard title="Where money comes from" delay={260} className="mt-4">
        {sources.length ? (
          <div className="space-y-3.5">
            {sources.map((s) => {
              const pct = s.share * 100;
              return (
                <div key={s.name}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate text-cream-dim">{s.name}</span>
                    <span className="shrink-0 text-xs text-faint">
                      · {s.count}× · {s.cadence}
                    </span>
                    <span className="tnum ml-auto shrink-0 text-cream">
                      {formatMoney(s.total, cur, { cents: false })}
                    </span>
                    <span className="tnum w-10 shrink-0 text-right text-muted">
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background:
                          "linear-gradient(90deg, var(--color-blue), var(--color-blue-deep))",
                      }}
                    />
                  </div>
                  <div className="mt-0.5 text-[0.65rem] text-faint">
                    {formatMoney(s.monthlyAvg, cur, { cents: false })}/mo average
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted">
            No income recorded in this window.
          </p>
        )}
      </SectionCard>

      {/* 4 · Behavior patterns */}
      <SectionCard title="How you spend" delay={320} className="mt-4">
        <WeekdayBars data={weekdays} currency={cur} />
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-xl border hairline bg-surface px-3 py-2.5">
            <div className="label-eyebrow">Avg transaction</div>
            <div className="tnum mt-1 text-lg text-cream">
              {formatMoney(avgSize, cur)}
            </div>
          </div>
          <div className="rounded-xl border hairline bg-surface px-3 py-2.5">
            <div className="label-eyebrow">Purchases</div>
            <div className="tnum mt-1 text-lg text-cream">{spendCount}</div>
          </div>
        </div>
        {biggest.length > 0 && (
          <div className="mt-6">
            <h3 className="label-eyebrow mb-3">Biggest single purchases</h3>
            <ul className="space-y-2.5">
              {biggest.map((t) => {
                const meta = categoryMeta(
                  t.userCategory || t.categoryPrimary,
                );
                return (
                  <li key={t.id} className="flex items-center gap-3 text-sm">
                    <span>{meta.glyph}</span>
                    <div className="min-w-0">
                      <div className="truncate text-cream">
                        {t.merchantName || t.name}
                      </div>
                      <div className="text-xs text-faint">
                        {formatDate(t.date)} · {meta.label}
                      </div>
                    </div>
                    <span className="tnum ml-auto text-cream">
                      {formatMoney(t.amount, cur)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </SectionCard>

      {/* 5 · Trends — hidden entirely with <4 months of history */}
      {trends.length > 0 && (
        <SectionCard title="What's changing" delay={380} className="mt-4">
          <p className="mb-4 text-xs text-muted">
            Average monthly spend, last 3 months vs the months before.
          </p>
          <div className="space-y-2.5">
            {trends.map((tr) => {
              const up = tr.recentAvg >= tr.priorAvg;
              return (
                <div key={tr.category} className="flex items-center gap-2.5 text-sm">
                  <span>{tr.glyph}</span>
                  <span className="text-cream-dim">{tr.label}</span>
                  <span
                    className={`text-xs ${up ? "text-coral" : "text-blue"}`}
                  >
                    {tr.deltaPct == null
                      ? "new"
                      : `${up ? "▲" : "▼"} ${Math.abs(Math.round(tr.deltaPct))}%`}
                  </span>
                  <span className="tnum ml-auto text-muted">
                    {formatMoney(tr.priorAvg, cur, { cents: false })} →{" "}
                    <span className="text-cream">
                      {formatMoney(tr.recentAvg, cur, { cents: false })}
                    </span>
                    /mo
                  </span>
                </div>
              );
            })}
          </div>
          {fresh.length > 0 && (
            <div className="mt-6">
              <h3 className="label-eyebrow mb-3">New merchants (last 3 months)</h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {fresh.slice(0, 8).map((m) => (
                  <li key={m.name} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border hairline bg-surface-2 text-sm text-slate">
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-cream">{m.name}</div>
                      <div className="text-xs text-faint">
                        {m.count}× since {formatDate(m.firstDate)}
                      </div>
                    </div>
                    <span className="tnum ml-auto text-sm text-cream">
                      {formatMoney(m.total, cur, { cents: false })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes; route list includes `/analysis` (dynamic).

- [ ] **Step 3: Commit**

```bash
git add "apps/moneytracker/src/app/(app)/analysis/page.tsx"
git commit -m "feat(moneytracker): Analysis page — income, cash flow, patterns, trends"
```

---

### Task 5: Add Analysis to the navigation

**Files:**
- Modify: `src/components/AppShell.tsx:8-15`

- [ ] **Step 1: Insert the nav item**

In the `NAV` array, insert the Analysis entry between Spending and Activity, so the array reads:

```tsx
const NAV = [
  { href: "/", label: "Overview", icon: "M3 12l9-8 9 8M5 10v10h14V10" },
  { href: "/spending", label: "Spending", icon: "M21 12a9 9 0 11-9-9v9z M12 3a9 9 0 019 9" },
  { href: "/analysis", label: "Analysis", icon: "M3 21h18M7 21V9m5 12V3m5 18v-7" },
  { href: "/transactions", label: "Activity", icon: "M3 6h18M3 12h18M3 18h12" },
  { href: "/accounts", label: "Accounts", icon: "M3 7h18v12H3zM3 7l2-3h14l2 3M8 13h2" },
  { href: "/recurring", label: "Recurring", icon: "M4 8a8 8 0 0114-5M20 16a8 8 0 01-14 5M17 3v5h-5M7 21v-5h5" },
  { href: "/settings", label: "Settings", icon: "M12 9a3 3 0 100 6 3 3 0 000-6zM3 12h2m14 0h2M12 3v2m0 14v2" },
];
```

(The icon is a bar chart: baseline + three rising bars, consistent with the existing single-path stroke style. Note the mobile bottom nav renders the same `NAV` array — 7 items still fit since labels are 0.6rem, but verify visually in Step 3.)

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/moneytracker/src/components/AppShell.tsx
git commit -m "feat(moneytracker): add Analysis to nav"
```

---

### Task 6: Manual verification against real data

No automated tests exist in this repo; this is the house verification step.

- [ ] **Step 1: Run the dev server**

Run from `apps/moneytracker/`: `npm run dev`
Open `http://localhost:3000/analysis` (log in if prompted).

- [ ] **Step 2: Check every section against real synced data**

- Hero: income/spending/net/savings-rate numbers are plausible and consistent (net = income − spending; rate = net/income).
- Cash flow: bars match the Overview page's cash-flow chart for the same months; per-month % row shows "—" only for zero-income months; best/toughest months look right.
- Income sources: paychecks grouped under one name with a sensible cadence (~biweekly/~monthly); internal transfers and card-payment credits do NOT appear (same exclusion as Recurring).
- How you spend: weekday bars sum to the hero spending total; biggest purchases are real purchases, not transfers.
- What's changing: deltas pass a sniff test against the Spending tab's habit averages; section absent if you have <4 months of data.
- Mobile width (devtools, ~390px): bottom nav fits 7 items; page sections stack cleanly.

- [ ] **Step 3: Fix anything found, re-verify, commit fixes**

Any fix gets its own small commit, e.g.:

```bash
git commit -m "fix(moneytracker): <what was wrong> on Analysis tab"
```
