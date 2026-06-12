import { AppState, Account, Transaction, NetWorthSnapshot } from "./types";
import { TRANSFER_CATEGORIES, categoryMeta, resolveCategoryKey } from "./categories";
import { monthKey } from "./format";

// Pure functions that derive every dashboard number from the two raw inputs:
// account balances (point-in-time) and transactions (flows). Sign convention
// follows Plaid: transaction.amount POSITIVE = money out, NEGATIVE = money in.

// Anything that isn't a liability counts as an asset (including type "other"),
// so the accounts page lists and these totals always agree.
export const LIABILITY_TYPES = new Set(["credit", "loan"]);

/**
 * The category that actually applies — a user override wins, then credit-card /
 * autopay payments are reclassified as transfers, then Plaid's category.
 */
export function effectiveCategory(t: Transaction): string {
  return resolveCategoryKey(t);
}

/** A transaction that should count as discretionary/spending outflow. */
function isSpend(t: Transaction): boolean {
  if (t.hidden || t.pending) return false;
  if (t.amount <= 0) return false; // inflow
  return !TRANSFER_CATEGORIES.has(effectiveCategory(t));
}

/** A transaction that should count as income (real inflow, not a transfer). */
function isIncome(t: Transaction): boolean {
  if (t.hidden || t.pending) return false;
  if (t.amount >= 0) return false; // outflow
  return !TRANSFER_CATEGORIES.has(effectiveCategory(t));
}

export interface NetWorthBreakdown {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  currency: string;
}

export function computeNetWorth(state: AppState): NetWorthBreakdown {
  let totalAssets = 0;
  let totalLiabilities = 0;
  const currency = state.accounts[0]?.currency ?? "USD";

  for (const acct of state.accounts) {
    const cur = acct.balances.current ?? 0;
    if (LIABILITY_TYPES.has(acct.type)) totalLiabilities += cur;
    else totalAssets += cur;
  }
  for (const m of state.manualEntries) {
    if (m.kind === "asset") totalAssets += m.value;
    else totalLiabilities += m.value;
  }
  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    currency,
  };
}

export interface MonthCashFlow {
  month: string; // yyyy-mm
  income: number; // positive
  spending: number; // positive
  net: number; // income - spending
}

export function cashFlowByMonth(
  state: AppState,
  months = 6,
): MonthCashFlow[] {
  const map = new Map<string, MonthCashFlow>();
  for (const t of state.transactions) {
    const key = monthKey(t.date);
    if (!map.has(key))
      map.set(key, { month: key, income: 0, spending: 0, net: 0 });
    const row = map.get(key)!;
    if (isSpend(t)) row.spending += t.amount;
    else if (isIncome(t)) row.income += -t.amount;
  }
  const rows = [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
  for (const r of rows) r.net = r.income - r.spending;
  return rows.slice(-months);
}

/** All months (yyyy-mm) that have any spending or income, oldest → newest. */
export function availableMonths(state: AppState): string[] {
  const set = new Set<string>();
  for (const t of state.transactions) {
    if (isSpend(t) || isIncome(t)) set.add(monthKey(t.date));
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export interface CategorySpend {
  category: string;
  label: string;
  color: string;
  glyph: string;
  total: number;
  count: number;
}

export function spendingByCategory(
  state: AppState,
  month?: string,
): CategorySpend[] {
  const map = new Map<string, CategorySpend>();
  for (const t of state.transactions) {
    if (!isSpend(t)) continue;
    if (month && monthKey(t.date) !== month) continue;
    const key = effectiveCategory(t);
    const meta = categoryMeta(key);
    if (!map.has(key))
      map.set(key, {
        category: key,
        label: meta.label,
        color: meta.color,
        glyph: meta.glyph,
        total: 0,
        count: 0,
      });
    const row = map.get(key)!;
    row.total += t.amount;
    row.count += 1;
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export interface MonthComposition {
  month: string;
  total: number;
  segments: CategorySpend[]; // sorted desc, share computable from total
}

/** Per-month spending broken down by category — for the stacked habits chart. */
export function monthlyComposition(
  state: AppState,
  monthsBack = 12,
): MonthComposition[] {
  const months = availableMonths(state).slice(-monthsBack);
  return months.map((m) => {
    const segments = spendingByCategory(state, m);
    const total = segments.reduce((a, c) => a + c.total, 0);
    return { month: m, total, segments };
  });
}

export interface CategoryHabit {
  category: string;
  label: string;
  color: string;
  glyph: string;
  total: number; // total over the window
  monthlyAvg: number; // average per active month
  monthsSeen: number; // how many months it appeared in (consistency)
  share: number; // fraction of all spend in the window
}

/**
 * Aggregate spending habits over the last N months: which categories you spend
 * on, how much on average per month, and how consistently.
 */
export function categoryHabits(
  state: AppState,
  monthsBack = 12,
): { habits: CategoryHabit[]; months: number; avgMonthlyTotal: number } {
  const comp = monthlyComposition(state, monthsBack);
  const months = comp.length || 1;
  const grand = comp.reduce((a, c) => a + c.total, 0) || 1;

  const acc = new Map<string, CategoryHabit>();
  for (const m of comp) {
    for (const seg of m.segments) {
      const h =
        acc.get(seg.category) ??
        {
          category: seg.category,
          label: seg.label,
          color: seg.color,
          glyph: seg.glyph,
          total: 0,
          monthlyAvg: 0,
          monthsSeen: 0,
          share: 0,
        };
      h.total += seg.total;
      h.monthsSeen += 1;
      acc.set(seg.category, h);
    }
  }
  const habits = [...acc.values()].map((h) => ({
    ...h,
    monthlyAvg: h.total / months,
    share: h.total / grand,
  }));
  habits.sort((a, b) => b.total - a.total);
  return {
    habits,
    months,
    avgMonthlyTotal: grand / months,
  };
}

export interface MerchantSpend {
  name: string;
  total: number;
  count: number;
}

export function topMerchants(
  state: AppState,
  month?: string,
  limit = 8,
): MerchantSpend[] {
  const map = new Map<string, MerchantSpend>();
  for (const t of state.transactions) {
    if (!isSpend(t)) continue;
    if (month && monthKey(t.date) !== month) continue;
    const name = t.merchantName || t.name || "Unknown";
    if (!map.has(name)) map.set(name, { name, total: 0, count: 0 });
    const row = map.get(name)!;
    row.total += t.amount;
    row.count += 1;
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}

export interface PeriodSummary {
  netWorth: NetWorthBreakdown;
  monthSpending: number;
  monthIncome: number;
  monthNet: number;
  month: string;
  // change vs previous month (spending)
  spendingDeltaPct: number | null;
}

export function currentMonthKey(state: AppState): string {
  // Use the latest transaction month so the dashboard is meaningful even with
  // sandbox/imported data that isn't from the current calendar month.
  let latest = "";
  for (const t of state.transactions) if (t.date > latest) latest = t.date;
  return monthKey(latest || new Date().toISOString());
}

export function summarize(state: AppState): PeriodSummary {
  const month = currentMonthKey(state);
  const flows = cashFlowByMonth(state, 24);
  const thisMonth = flows.find((f) => f.month === month);
  const idx = flows.findIndex((f) => f.month === month);
  const prev = idx > 0 ? flows[idx - 1] : undefined;
  const monthSpending = thisMonth?.spending ?? 0;
  const spendingDeltaPct =
    prev && prev.spending > 0
      ? ((monthSpending - prev.spending) / prev.spending) * 100
      : null;
  return {
    netWorth: computeNetWorth(state),
    monthSpending,
    monthIncome: thisMonth?.income ?? 0,
    monthNet: thisMonth?.net ?? 0,
    month,
    spendingDeltaPct,
  };
}

/** Accounts grouped by asset vs liability for the accounts view. */
export function groupAccounts(state: AppState): {
  assets: Account[];
  liabilities: Account[];
} {
  const assets: Account[] = [];
  const liabilities: Account[] = [];
  for (const a of state.accounts) {
    if (LIABILITY_TYPES.has(a.type)) liabilities.push(a);
    else assets.push(a);
  }
  return { assets, liabilities };
}

/** Append today's net-worth point to the snapshot series (idempotent per day). */
export function recordSnapshot(state: AppState, today: string): void {
  const nw = computeNetWorth(state);
  const existing = state.snapshots.find((s) => s.date === today);
  const snap: NetWorthSnapshot = {
    date: today,
    totalAssets: nw.totalAssets,
    totalLiabilities: nw.totalLiabilities,
    netWorth: nw.netWorth,
  };
  if (existing) Object.assign(existing, snap);
  else state.snapshots.push(snap);
  state.snapshots.sort((a, b) => a.date.localeCompare(b.date));
}
