import { AppState, Transaction } from "./types";
import {
  availableMonths,
  effectiveCategory,
  isIncome,
  isSpend,
  isSyntheticBaseline,
  refundMatchedIds,
} from "./analytics";
import { categoryMeta } from "./categories";
import { displayPayee, incomeSourceLabel } from "./aliases";
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
  const neutralized = refundMatchedIds(state);
  let income = 0;
  let spending = 0;
  for (const t of state.transactions) {
    if (!within(t)) continue;
    if (isSpend(t, neutralized)) spending += t.amount;
    else if (isIncome(t, neutralized)) income += -t.amount;
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
  const neutralized = refundMatchedIds(state);
  const byName = new Map<string, { total: number; dates: string[] }>();
  for (const t of state.transactions) {
    if (!isIncome(t, neutralized) || !within(t)) continue;
    const name = incomeSourceLabel(t.merchantName, t.name);
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

// ── Income, broken down by source and by month ──────────────────────────────
//
// Spending has Plaid categories; income realistically doesn't (almost everything
// lands in INCOME), so the meaningful breakdown is by *source* — the payer name
// (paycheck, a client, interest, refunds, Venmo from a friend). A cool-toned
// palette keeps income visually distinct from the warm spending categories. The
// top sources get a stable color so the same payer is the same color in every
// month's bar; everything past the palette collapses into a single "Other".

const INCOME_PALETTE = [
  "#2563eb", // blue
  "#0ea5e9", // sky
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#3b82f6", // blue-2
  "#7c3aed", // purple
  "#0284c7", // deep sky
];
const INCOME_OTHER_COLOR = "#64748b"; // slate
const INCOME_OTHER_LABEL = "Other";

export interface IncomeSegment {
  name: string;
  total: number; // positive
  color: string;
  count: number;
}

export interface IncomeMonth {
  month: string; // yyyy-mm
  total: number;
  segments: IncomeSegment[]; // sorted desc, share computable from total
}

export interface IncomeBreakdown {
  /** Every month with income, oldest → newest. */
  months: string[];
  /** Per-month source segments, aligned to `months`. */
  byMonth: IncomeMonth[];
  /** Top sources + "Other", by all-time total — the stable color legend. */
  legend: { name: string; color: string; total: number }[];
}

/**
 * A shallow state clone keeping only transactions from one payer — matched by a
 * case-insensitive substring of the raw merchant, the raw name, or the
 * normalized income-source label (so noise-stripped variants still match). Lets
 * the Income tab scope itself to a single source (e.g. RareLiquid) by passing
 * the result through the same breakdown functions.
 */
export function filterBySource(state: AppState, query: string): AppState {
  const q = query.toLowerCase();
  const hit = (t: Transaction) =>
    (t.merchantName ?? "").toLowerCase().includes(q) ||
    (t.name ?? "").toLowerCase().includes(q) ||
    incomeSourceLabel(t.merchantName, t.name).toLowerCase().includes(q);
  return { ...state, transactions: state.transactions.filter(hit) };
}

/** Months (yyyy-mm) that have any income, oldest → newest. */
export function incomeMonths(state: AppState): string[] {
  const neutralized = refundMatchedIds(state);
  const set = new Set<string>();
  for (const t of state.transactions)
    if (isIncome(t, neutralized)) set.add(monthKey(t.date));
  return [...set].sort((a, b) => a.localeCompare(b));
}

/**
 * Income across all history, grouped by source and split per month. Colors are
 * assigned once from all-time totals so a source keeps the same color in every
 * month's bar and in the legend; sources beyond the palette become "Other".
 */
export function incomeBreakdown(state: AppState): IncomeBreakdown {
  const months = incomeMonths(state);

  // All-time total per source → ranking that drives stable color assignment.
  const neutralized = refundMatchedIds(state);
  const totals = new Map<string, number>();
  for (const t of state.transactions) {
    if (!isIncome(t, neutralized)) continue;
    const name = incomeSourceLabel(t.merchantName, t.name);
    totals.set(name, (totals.get(name) ?? 0) + -t.amount);
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const colorOf = new Map<string, string>();
  ranked
    .slice(0, INCOME_PALETTE.length)
    .forEach(([name], i) => colorOf.set(name, INCOME_PALETTE[i]));
  const labelFor = (raw: string) =>
    colorOf.has(raw) ? raw : INCOME_OTHER_LABEL;
  const colorFor = (raw: string) => colorOf.get(raw) ?? INCOME_OTHER_COLOR;

  const byMonthMap = new Map<string, Map<string, IncomeSegment>>();
  for (const m of months) byMonthMap.set(m, new Map());
  for (const t of state.transactions) {
    if (!isIncome(t, neutralized)) continue;
    const m = monthKey(t.date);
    const segs = byMonthMap.get(m);
    if (!segs) continue;
    const raw = incomeSourceLabel(t.merchantName, t.name);
    const name = labelFor(raw);
    const row = segs.get(name) ?? { name, total: 0, color: colorFor(raw), count: 0 };
    row.total += -t.amount;
    row.count += 1;
    segs.set(name, row);
  }
  const byMonth: IncomeMonth[] = months.map((month) => {
    const segments = [...byMonthMap.get(month)!.values()].sort(
      (a, b) => b.total - a.total,
    );
    return {
      month,
      total: segments.reduce((a, s) => a + s.total, 0),
      segments,
    };
  });

  const legend = ranked
    .slice(0, INCOME_PALETTE.length)
    .map(([name, total]) => ({ name, color: colorOf.get(name)!, total }));
  if (ranked.length > INCOME_PALETTE.length) {
    legend.push({
      name: INCOME_OTHER_LABEL,
      color: INCOME_OTHER_COLOR,
      total: ranked
        .slice(INCOME_PALETTE.length)
        .reduce((a, [, v]) => a + v, 0),
    });
  }
  return { months, byMonth, legend };
}

/** The biggest single income deposits in the window. */
export function largestDeposits(
  state: AppState,
  monthsBack = 12,
  limit = 5,
): Transaction[] {
  return largestDepositsForMonths(state, windowMonths(state, monthsBack), limit);
}

/** The biggest single income deposits across an explicit set of months. */
export function largestDepositsForMonths(
  state: AppState,
  months: string[],
  limit = 5,
): Transaction[] {
  const set = new Set(months);
  const neutralized = refundMatchedIds(state);
  return state.transactions
    .filter((t) => isIncome(t, neutralized) && set.has(monthKey(t.date)))
    .sort((a, b) => a.amount - b.amount) // most negative = largest inflow
    .slice(0, limit);
}

/**
 * Synthetic income sources: rent that's covered on your behalf and so never
 * lands in the bank feed. Each is independently toggled on from the Income tab
 * (via its own URL key) to sanity-check that total compensation lines up.
 */
export interface PhantomIncome {
  key: string; // URL param that switches it on (?<key>=on)
  label: string; // source name shown in the chart, donut, and legend
  short: string; // toggle-button label
  monthly: number;
  color: string;
}

export const PHANTOM_INCOME: PhantomIncome[] = [
  {
    key: "rent",
    label: "Rent · RareLiquid",
    short: "Rent (RareLiquid)",
    monthly: 1600,
    color: "#d4a574", // warm tan — set apart from the blue salary palette
  },
  {
    key: "studio",
    label: "Studio rent · RareLiquid",
    short: "Studio rent (RareLiquid)",
    monthly: 1600,
    color: "#5e9c8a", // muted teal — distinct from the home-rent tan
  },
];

/**
 * Add each active phantom source as its own segment to every month so it flows
 * through the chart, donut, stat row, and legend exactly like a real payer.
 * Leaves real transactions (and therefore the largest-deposits list) untouched.
 */
export function withPhantomIncome(
  byMonth: IncomeMonth[],
  active: PhantomIncome[],
): IncomeMonth[] {
  if (active.length === 0) return byMonth;
  const extra = active.reduce((a, p) => a + p.monthly, 0);
  return byMonth.map((m) => ({
    ...m,
    total: m.total + extra,
    segments: [
      ...m.segments,
      ...active.map((p) => ({
        name: p.label,
        total: p.monthly,
        color: p.color,
        count: 1,
      })),
    ].sort((a, b) => b.total - a.total),
  }));
}

/** Sum a set of monthly income breakdowns into one source-segment list. */
export function mergeIncomeMonths(list: IncomeMonth[]): {
  total: number;
  segments: IncomeSegment[];
} {
  const map = new Map<string, IncomeSegment>();
  for (const m of list) {
    for (const s of m.segments) {
      const e =
        map.get(s.name) ?? { name: s.name, total: 0, color: s.color, count: 0 };
      e.total += s.total;
      e.count += s.count;
      map.set(s.name, e);
    }
  }
  // Keep a real "Other" bucket last; everything else by size.
  const segments = [...map.values()].sort((a, b) =>
    a.name === "Other" ? 1 : b.name === "Other" ? -1 : b.total - a.total,
  );
  return { total: segments.reduce((a, s) => a + s.total, 0), segments };
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
  const neutralized = refundMatchedIds(state);
  const rows = WEEKDAYS.map((weekday) => ({ weekday, total: 0, count: 0 }));
  for (const t of state.transactions) {
    if (!isSpend(t, neutralized) || !within(t)) continue;
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
  const neutralized = refundMatchedIds(state);
  return state.transactions
    .filter(
      (t) =>
        !isSyntheticBaseline(t) && isSpend(t, neutralized) && within(t),
    )
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
  const neutralized = refundMatchedIds(state);
  const acc = new Map<string, { recent: number; prior: number }>();
  for (const t of state.transactions) {
    if (!isSpend(t, neutralized)) continue;
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
  const neutralized = refundMatchedIds(state);
  const acctName = new Map(state.accounts.map((a) => [a.id, a.name]));
  const byName = new Map<string, NewMerchant>();
  for (const t of state.transactions) {
    if (!isSpend(t, neutralized)) continue;
    const name = displayPayee(t.merchantName, t.name, acctName.get(t.accountId));
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
