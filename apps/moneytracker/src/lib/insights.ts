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

/** Window totals: income, spending, net, and savings rate (net / income). */
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

/** Total spending per day of week (Mon-first) over the window. */
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

/** The biggest single spend transactions in the window. */
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

export interface SpendTrend {
  category: string;
  label: string;
  color: string;
  glyph: string;
  recentAvg: number; // avg monthly spend over the last 3 available months
  priorAvg: number; // avg monthly spend over the earlier months in the window
  /** % change recent vs prior, or null when the category is brand-new. */
  deltaPct: number | null;
}

/** How many trailing months count as "recent" in trend comparisons. */
const RECENT_MONTHS = 3;

/** Per-category avg monthly spend, last RECENT_MONTHS vs the months before. */
export function categorySpendTrends(
  state: AppState,
  monthsBack = 12,
): SpendTrend[] {
  const months = windowMonths(state, monthsBack);
  // A 3-vs-prior split needs at least one prior month to compare against.
  if (months.length <= RECENT_MONTHS) return [];
  const recent = new Set(months.slice(-RECENT_MONTHS));
  const prior = new Set(months.slice(0, -RECENT_MONTHS));
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
  /** All-time spend at the merchant — equals window spend, since they're new. */
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
  recentMonths = RECENT_MONTHS,
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
