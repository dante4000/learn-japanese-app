import {
  AppState,
  Account,
  Transaction,
  NetWorthSnapshot,
  RecurringStream,
} from "./types";
import {
  TRANSFER_CATEGORIES,
  categoryMeta,
  resolveCategoryKey,
  isInternalPayment,
} from "./categories";
import { monthKey } from "./format";
import { displayPayee } from "./aliases";

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

export interface CashFlowRow extends MonthCashFlow {
  savingsRate: number | null; // net / income, null if no income
}

export interface CashFlowDetailSummary {
  rows: CashFlowRow[];
  avgIncome: number;
  avgSpending: number;
  avgNet: number;
  totalNet: number;
  savingsRate: number | null; // avg net / avg income
  bestMonth: CashFlowRow | null; // highest net
  worstMonth: CashFlowRow | null; // lowest net
}

/** Cash flow with per-month savings rate + period averages, for the detail view. */
export function cashFlowDetail(
  state: AppState,
  months = 6,
): CashFlowDetailSummary {
  const rows: CashFlowRow[] = cashFlowByMonth(state, months).map((r) => ({
    ...r,
    savingsRate: r.income > 0 ? r.net / r.income : null,
  }));
  const n = rows.length || 1;
  const sum = (f: (r: CashFlowRow) => number) => rows.reduce((a, r) => a + f(r), 0);
  const avgIncome = sum((r) => r.income) / n;
  const avgNet = sum((r) => r.net) / n;
  const sorted = [...rows].sort((a, b) => b.net - a.net);
  return {
    rows,
    avgIncome,
    avgSpending: sum((r) => r.spending) / n,
    avgNet,
    totalNet: sum((r) => r.net),
    savingsRate: avgIncome > 0 ? avgNet / avgIncome : null,
    bestMonth: sorted[0] ?? null,
    worstMonth: sorted[sorted.length - 1] ?? null,
  };
}

/** All months (yyyy-mm) that have any spending or income, oldest → newest. */
export function availableMonths(state: AppState): string[] {
  const set = new Set<string>();
  for (const t of state.transactions) {
    if (isSpend(t) || isIncome(t)) set.add(monthKey(t.date));
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function nextMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 7);
}

/**
 * Fill in recurring baselines: for each month (within the data range, from the
 * baseline's startMonth) that lacks a real charge in the baseline's category,
 * add a synthetic "(estimated)" transaction so totals/trends are honest. Months
 * that already have a matching charge are left untouched (no double-counting).
 */
export function injectBaselines(state: AppState): AppState {
  const baselines = state.baselines ?? [];
  if (!baselines.length) return state;
  const months = availableMonths(state);
  if (!months.length) return state;
  const earliest = months[0];
  const latest = months[months.length - 1];
  const currency = state.accounts[0]?.currency ?? "USD";
  const synthetic: Transaction[] = [];

  for (const b of baselines) {
    let m = b.startMonth > earliest ? b.startMonth : earliest;
    let guard = 0;
    while (m <= latest && guard < 600) {
      const hasReal = state.transactions.some(
        (t) =>
          !t.hidden &&
          t.amount > 0 &&
          monthKey(t.date) === m &&
          effectiveCategory(t) === b.category &&
          t.amount >= b.amount * 0.5,
      );
      if (!hasReal) {
        synthetic.push({
          id: `baseline_${b.id}_${m}`,
          accountId: "__baseline__",
          amount: b.amount,
          currency,
          date: `${m}-01`,
          name: `${b.name} (estimated)`,
          merchantName: b.name,
          pending: false,
          categoryPrimary: b.category,
          categoryDetailed: null,
          paymentChannel: null,
          source: "manual",
          userCategory: null,
          note: "Estimated recurring baseline",
          hidden: false,
        });
      }
      m = nextMonth(m);
      guard++;
    }
  }
  if (!synthetic.length) return state;
  return {
    ...state,
    transactions: [...state.transactions, ...synthetic].sort((a, b) =>
      b.date.localeCompare(a.date),
    ),
  };
}

/**
 * Subscriptions/bills that appear to be offset by a statement credit on the
 * same card (e.g. an Amex/Bilt perk credit). Returns streamId → credit amount.
 */
export function reimbursedStreams(state: AppState): Map<string, number> {
  const creditAccts = new Set(
    state.accounts.filter((a) => a.type === "credit").map((a) => a.id),
  );
  const credits = state.transactions.filter(
    (t) =>
      t.amount < 0 &&
      !t.pending &&
      creditAccts.has(t.accountId) &&
      /\b(credit|reward|reimburs\w*|adjustment|cash\s?back)\b/i.test(
        `${t.name} ${t.merchantName ?? ""}`,
      ) &&
      !/payment/i.test(t.name || ""),
  );
  const result = new Map<string, number>();
  for (const s of state.recurring) {
    if (s.type !== "outflow" || !s.isActive) continue;
    const amt = Math.abs(s.lastAmount || s.averageAmount);
    if (amt <= 0) continue;
    const match = credits.find(
      (c) =>
        c.accountId === s.accountId &&
        Math.abs(Math.abs(c.amount) - amt) <= Math.max(3, amt * 0.2),
    );
    if (match) result.set(s.id, Math.abs(match.amount));
  }
  return result;
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
    const name = displayPayee(t.merchantName, t.name);
    if (!map.has(name)) map.set(name, { name, total: 0, count: 0 });
    const row = map.get(name)!;
    row.total += t.amount;
    row.count += 1;
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}

export interface AccountSpend {
  accountId: string;
  name: string;
  total: number;
  count: number;
}

/** Spending grouped by account — where the money actually flows out. */
export function spendingByAccount(
  state: AppState,
  month?: string,
): AccountSpend[] {
  const names = new Map(state.accounts.map((a) => [a.id, a.name]));
  const map = new Map<string, AccountSpend>();
  for (const t of state.transactions) {
    if (!isSpend(t)) continue;
    if (month && monthKey(t.date) !== month) continue;
    if (!map.has(t.accountId))
      map.set(t.accountId, {
        accountId: t.accountId,
        name: names.get(t.accountId) ?? "Account",
        total: 0,
        count: 0,
      });
    const r = map.get(t.accountId)!;
    r.total += t.amount;
    r.count += 1;
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export interface DaySpend {
  day: number;
  date: string;
  total: number;
}

export interface DailySpending {
  days: DaySpend[];
  cumulative: number[];
  total: number;
  daysInMonth: number;
  throughDay: number;
  projected: number | null; // run-rate projection to month end
  avgPerDay: number;
}

/** Per-day spending for a month, plus a run-rate month-end projection. */
export function dailySpending(state: AppState, month: string): DailySpending {
  const [y, mo] = month.split("-").map(Number);
  const daysInMonth = new Date(y, mo, 0).getDate();
  const days: DaySpend[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    date: `${month}-${String(i + 1).padStart(2, "0")}`,
    total: 0,
  }));
  let total = 0;
  let throughDay = 0;
  for (const t of state.transactions) {
    if (!isSpend(t)) continue;
    if (monthKey(t.date) !== month) continue;
    const d = Number(t.date.slice(8, 10));
    if (d >= 1 && d <= daysInMonth) {
      days[d - 1].total += t.amount;
      total += t.amount;
      if (d > throughDay) throughDay = d;
    }
  }
  let running = 0;
  const cumulative = days.map((d) => (running += d.total));
  return {
    days,
    cumulative,
    total,
    daysInMonth,
    throughDay,
    projected: throughDay > 0 ? (total / throughDay) * daysInMonth : null,
    avgPerDay: throughDay > 0 ? total / throughDay : 0,
  };
}

export interface CategoryMover extends CategorySpend {
  current: number;
  previous: number;
  delta: number;
  deltaPct: number | null;
}

/** Categories that changed most vs the previous month (biggest movers). */
export function categoryMovers(
  state: AppState,
  month: string,
  prevMonth: string | null,
  limit = 5,
): CategoryMover[] {
  const cur = spendingByCategory(state, month);
  const prev = new Map(
    (prevMonth ? spendingByCategory(state, prevMonth) : []).map((c) => [
      c.category,
      c.total,
    ]),
  );
  const movers: CategoryMover[] = cur.map((c) => {
    const p = prev.get(c.category) ?? 0;
    return {
      ...c,
      current: c.total,
      previous: p,
      delta: c.total - p,
      deltaPct: p > 0 ? ((c.total - p) / p) * 100 : null,
    };
  });
  // categories that vanished this month (dropped to 0)
  for (const [cat, p] of prev) {
    if (!cur.some((c) => c.category === cat)) {
      const meta = categoryMeta(cat);
      movers.push({
        category: cat,
        label: meta.label,
        color: meta.color,
        glyph: meta.glyph,
        total: 0,
        count: 0,
        current: 0,
        previous: p,
        delta: -p,
        deltaPct: -100,
      });
    }
  }
  return movers
    .filter((m) => Math.abs(m.delta) > 0.5)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, limit);
}

export interface UpcomingBill {
  id: string;
  name: string;
  categoryPrimary: string;
  amount: number; // positive
  frequency: string;
  nextDate: string; // yyyy-mm-dd
  daysUntil: number;
  predicted: boolean; // true if we estimated the date (Plaid didn't supply one)
}

/** A recurring outflow that's a real bill/subscription, not an internal payment. */
/**
 * A recurring stream that's really money moving between your own accounts — a
 * card payment or transfer — not a genuine subscription/bill or income. Uses
 * the shared TRANSFER_CATEGORIES set (TRANSFER_IN/OUT *and* LOAN_PAYMENTS) plus
 * the description heuristic, so card payments are excluded everywhere the same
 * way spending/income already exclude them.
 */
export function isTransferStream(s: RecurringStream): boolean {
  return (
    TRANSFER_CATEGORIES.has(s.categoryPrimary) ||
    isInternalPayment(s.description, s.merchantName)
  );
}

function isBillStream(s: RecurringStream): boolean {
  if (s.type !== "outflow" || !s.isActive) return false;
  return !isTransferStream(s);
}

function addInterval(date: string, freq: string): string {
  const d = new Date(date + "T00:00:00Z");
  if (freq === "WEEKLY") d.setUTCDate(d.getUTCDate() + 7);
  else if (freq === "BIWEEKLY") d.setUTCDate(d.getUTCDate() + 14);
  else if (freq === "SEMI_MONTHLY") d.setUTCDate(d.getUTCDate() + 15);
  else if (freq === "ANNUALLY") d.setUTCFullYear(d.getUTCFullYear() + 1);
  else d.setUTCMonth(d.getUTCMonth() + 1); // MONTHLY / UNKNOWN
  return d.toISOString().slice(0, 10);
}

function dayDiff(from: string, to: string): number {
  return Math.round(
    (Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000,
  );
}

/**
 * Upcoming bills/subscriptions with their next predicted charge date. `today`
 * is yyyy-mm-dd (passed in so this stays a pure function). Uses Plaid's
 * predicted date when available and in the future, otherwise rolls the last
 * charge forward by the stream's cadence.
 */
export function upcomingBills(
  state: AppState,
  today: string,
  withinDays = 45,
): { bills: UpcomingBill[]; dueSoonTotal: number; monthlyTotal: number } {
  const bills: UpcomingBill[] = [];
  for (const s of state.recurring) {
    if (!isBillStream(s)) continue;
    let date = s.predictedNextDate && s.predictedNextDate >= today
      ? s.predictedNextDate
      : s.lastDate;
    let predicted = !(s.predictedNextDate && s.predictedNextDate >= today);
    if (!date) continue;
    let guard = 0;
    while (date < today && guard < 60) {
      date = addInterval(date, s.frequency);
      predicted = true;
      guard++;
    }
    bills.push({
      id: s.id,
      name: displayPayee(s.merchantName, s.description),
      categoryPrimary: s.categoryPrimary,
      amount: Math.abs(s.lastAmount || s.averageAmount),
      frequency: s.frequency,
      nextDate: date,
      daysUntil: dayDiff(today, date),
      predicted,
    });
  }
  bills.sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  const within = bills.filter((b) => b.daysUntil <= withinDays);
  return {
    bills: within,
    dueSoonTotal: within
      .filter((b) => b.daysUntil <= 30)
      .reduce((a, b) => a + b.amount, 0),
    monthlyTotal: 0,
  };
}

export interface PacePoint {
  day: number;
  current: number | null; // cumulative spend this month (null after today)
  previous: number | null; // cumulative spend last month, same day
}

export interface SpendPace {
  points: PacePoint[];
  daysInMonth: number;
  throughDay: number;
  currentToDate: number;
  previousToDate: number | null; // last month's cumulative at the same day
}

/** Day-by-day cumulative spend for the month vs the previous month (pace). */
export function spendingPace(
  state: AppState,
  month: string,
  prevMonth: string | null,
): SpendPace {
  const cur = dailySpending(state, month);
  const prev = prevMonth ? dailySpending(state, prevMonth) : null;
  const daysInMonth = cur.daysInMonth;
  const through = cur.throughDay || cur.daysInMonth;
  const points: PacePoint[] = [];
  for (let i = 0; i < daysInMonth; i++) {
    points.push({
      day: i + 1,
      current: i < through ? cur.cumulative[i] : null,
      previous: prev && i < prev.daysInMonth ? prev.cumulative[i] : null,
    });
  }
  const prevIdx = Math.min(through, prev?.daysInMonth ?? 0) - 1;
  return {
    points,
    daysInMonth,
    throughDay: through,
    currentToDate: cur.cumulative[through - 1] ?? cur.total,
    previousToDate: prev && prevIdx >= 0 ? prev.cumulative[prevIdx] : null,
  };
}

export interface CategoryTrend {
  category: string;
  label: string;
  color: string;
  glyph: string;
  series: number[]; // spend per month, aligned to `months`
  total: number;
  latest: number;
  delta: number; // latest vs prior month
}

/** Monthly spend series per top category — for trend sparklines. */
export function categoryTrends(
  state: AppState,
  monthsBack = 6,
  limit = 6,
): { months: string[]; trends: CategoryTrend[] } {
  const months = availableMonths(state).slice(-monthsBack);
  const byCat = new Map<string, CategoryTrend>();
  months.forEach((m, idx) => {
    for (const c of spendingByCategory(state, m)) {
      if (!byCat.has(c.category))
        byCat.set(c.category, {
          category: c.category,
          label: c.label,
          color: c.color,
          glyph: c.glyph,
          series: months.map(() => 0),
          total: 0,
          latest: 0,
          delta: 0,
        });
      const t = byCat.get(c.category)!;
      t.series[idx] = c.total;
      t.total += c.total;
    }
  });
  const trends = [...byCat.values()].map((t) => {
    const n = t.series.length;
    return {
      ...t,
      latest: t.series[n - 1] ?? 0,
      delta: (t.series[n - 1] ?? 0) - (t.series[n - 2] ?? 0),
    };
  });
  trends.sort((a, b) => b.total - a.total);
  return { months, trends: trends.slice(0, limit) };
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

export interface DuplicateGroup {
  merchant: string;
  amount: number;
  accountId: string;
  date: string; // all charges in the group share this date
  /** 2+ identical posted charges: same account, merchant, amount, and day. */
  transactions: Transaction[];
}

/** Normalize a merchant/description for matching: lowercase, strip punctuation
 *  and store/location numbers so "STARBUCKS #1234" ≈ "Starbucks". */
function normalizeMerchant(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b\d{2,}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** A merchant+amount that recurs on more than this many distinct days is a
 *  pattern (ad spend, an undetected subscription, a daily same-price habit) —
 *  not an accidental double-charge. */
const DUP_MAX_DISTINCT_DAYS = 2;

/**
 * True double-charges: posted (non-pending), visible outflows that are the
 * EXACT same charge — same account, same merchant, same amount, AND the same
 * day, charged 2+ times. To stay clear of legitimate repeats, a combo is only
 * considered if it's essentially a one-off: it appears on at most two distinct
 * days across all history. That drops habitual spend (a daily coffee at the
 * same price), ad billing (identical Meta/Facebook charges many days), and
 * subscriptions Plaid didn't tag as recurring (newsletters, insurance) — all of
 * which repeat across many days. Detected recurring streams are excluded
 * outright. Two genuine same-day same-price buys can still match, hence
 * "possible" — this surfaces candidates, it doesn't judge.
 */
export function findPossibleDuplicates(state: AppState): DuplicateGroup[] {
  // Merchants we know recur — never flag these.
  const recurring = new Set<string>();
  for (const r of state.recurring) {
    if (r.merchantName) recurring.add(normalizeMerchant(r.merchantName));
    if (r.description) recurring.add(normalizeMerchant(r.description));
  }

  // Bucket eligible spends by account|merchant|amount (date-independent), so we
  // can judge how often each combo recurs before flagging same-day clusters.
  const buckets = new Map<string, Transaction[]>();
  for (const t of state.transactions) {
    if (t.pending || t.hidden || t.amount <= 0) continue;
    const norm = normalizeMerchant(t.merchantName || t.name);
    if (!norm || recurring.has(norm)) continue;
    const key = `${t.accountId}|${norm}|${t.amount.toFixed(2)}`;
    const list = buckets.get(key);
    if (list) list.push(t);
    else buckets.set(key, [t]);
  }

  const groups: DuplicateGroup[] = [];
  for (const list of buckets.values()) {
    if (list.length < 2) continue;
    const distinctDays = new Set(list.map((t) => t.date));
    if (distinctDays.size > DUP_MAX_DISTINCT_DAYS) continue; // a pattern, not a slip
    // Emit one group per day that actually has 2+ charges.
    const byDay = new Map<string, Transaction[]>();
    for (const t of list) {
      const d = byDay.get(t.date);
      if (d) d.push(t);
      else byDay.set(t.date, [t]);
    }
    for (const [date, day] of byDay) {
      if (day.length < 2) continue;
      groups.push({
        merchant: displayPayee(day[0].merchantName, day[0].name),
        amount: day[0].amount,
        accountId: day[0].accountId,
        date,
        transactions: day,
      });
    }
  }
  // Most recent first.
  groups.sort((a, b) => b.date.localeCompare(a.date));
  return groups;
}
