import {
  AppState,
  Account,
  Transaction,
  NetWorthSnapshot,
  RecurringBaseline,
  RecurringStream,
  RecurringFrequency,
} from "./types";
import {
  TRANSFER_CATEGORIES,
  categoryMeta,
  resolveCategoryKey,
  isInternalPayment,
  isHousingTransaction,
} from "./categories";
import { monthKey } from "./format";
import { monthlyEquivalent } from "./recurring";
import { displayPayee } from "./aliases";

// Pure functions that derive every dashboard number from the two raw inputs:
// account balances (point-in-time) and transactions (flows). Sign convention
// follows Plaid: transaction.amount POSITIVE = money out, NEGATIVE = money in.

// Anything that isn't a liability counts as an asset (including type "other"),
// so the accounts page lists and these totals always agree.
export const LIABILITY_TYPES = new Set(["credit", "loan"]);

// Account id carried by the synthetic "(estimated)" transactions that
// injectBaselines fabricates to fill months the bank feed misses. They belong
// in analytics totals but NOT in the raw ledger — the Activity feed and CSV
// export filter them out by this id (they have no real account and can't be
// edited or re-imported).
export const BASELINE_ACCOUNT_ID = "__baseline__";

/** True for the synthetic baseline rows injected by injectBaselines. */
export function isSyntheticBaseline(t: Transaction): boolean {
  return t.accountId === BASELINE_ACCOUNT_ID;
}

/**
 * The category that actually applies — a user override wins, then credit-card /
 * autopay payments are reclassified as transfers, then Plaid's category.
 */
export function effectiveCategory(t: Transaction): string {
  return resolveCategoryKey(t);
}

/** Posted spending, net of refunds in the month each entry posts. */
export function isSpend(t: Transaction): boolean {
  if (t.hidden || t.pending || t.amount === 0) return false;
  return categoryMeta(effectiveCategory(t)).isSpending;
}

/** Classify card credits from payment or refund evidence in the read model.
 * Unknown credits are excluded from income and spending; raw data stays intact. */
export function normalizeAccountTransactions(state: AppState): AppState {
  const accountTypes = new Map(state.accounts.map((a) => [a.id, a.type]));
  const purchases = new Map<string, Transaction[]>();
  for (const t of state.transactions) {
    if (t.amount <= 0 || !isSpend(t)) continue;
    const key = JSON.stringify([t.accountId, t.currency, normalizeMerchant(t.merchantName || t.name)]);
    const list = purchases.get(key) ?? [];
    list.push(t);
    purchases.set(key, list);
  }
  for (const list of purchases.values()) list.sort((a, b) => b.date.localeCompare(a.date));
  return { ...state, transactions: state.transactions.map((t) => {
    const accountType = accountTypes.get(t.accountId);
    if (t.userCategory || t.amount >= 0 || accountType !== "credit") return t;
    if (isInternalPayment(t.name, t.merchantName, accountType, t.amount))
      return { ...t, categoryPrimary: "TRANSFER_IN" };
    if (effectiveCategory(t) !== "INCOME") return t;
    const key = JSON.stringify([t.accountId, t.currency, normalizeMerchant(t.merchantName || t.name)]);
    const purchase = purchases.get(key)?.find((p) => p.date <= t.date && p.amount >= Math.abs(t.amount));
    // No merchant purchase evidence: do not invent earned income or a refund.
    return { ...t, categoryPrimary: purchase ? effectiveCategory(purchase) : "TRANSFER_IN" };
  }) };
}

/** Posted earned income. Transfers and spending credits are excluded. */
export function isIncome(t: Transaction): boolean {
  if (t.hidden || t.pending) return false;
  if (t.amount >= 0) return false; // outflow
  const cat = effectiveCategory(t);
  if (TRANSFER_CATEGORIES.has(cat)) return false;
  // Other deposits and spending refunds never become earned income.
  return cat === "INCOME";
}

// Full refund pairs suppress duplicate warnings and recurring predictions.
// Spending totals use signed entries on their posting dates.
const refundMatchCache = new WeakMap<Transaction[], Set<string>>();

export function refundMatchedIds(state: AppState): Set<string> {
  const cached = refundMatchCache.get(state.transactions);
  if (cached) return cached;

  const matched = new Set<string>();
  const purchases = new Map<string, Transaction[]>(); // account|merchant|amt → charges
  const refunds: Transaction[] = [];
  for (const t of state.transactions) {
    if (t.hidden || t.pending) continue;
    if (!categoryMeta(effectiveCategory(t)).isSpending) continue;
    const norm = normalizeMerchant(t.merchantName || t.name);
    if (!norm) continue;
    if (t.amount > 0) {
      const key = `${t.accountId}|${norm}|${t.amount.toFixed(2)}`;
      const list = purchases.get(key);
      if (list) list.push(t);
      else purchases.set(key, [t]);
    } else if (t.amount < 0) {
      refunds.push(t);
    }
  }
  for (const list of purchases.values())
    list.sort((a, b) => a.date.localeCompare(b.date));
  refunds.sort((a, b) => a.date.localeCompare(b.date));

  for (const r of refunds) {
    const norm = normalizeMerchant(r.merchantName || r.name);
    const key = `${r.accountId}|${norm}|${Math.abs(r.amount).toFixed(2)}`;
    const list = purchases.get(key);
    if (!list || list.length === 0) continue;
    // Claim the most recent charge on or before the refund's date.
    let idx = -1;
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].date <= r.date) {
        idx = i;
        break;
      }
    }
    if (idx === -1) continue;
    matched.add(list[idx].id);
    matched.add(r.id);
    list.splice(idx, 1);
  }

  refundMatchCache.set(state.transactions, matched);
  return matched;
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
    if (isSpend(t) || isIncome(t))
      set.add(monthKey(t.date));
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

function nextMonth(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 7);
}

/**
 * Same name + category = one recurring bill over time, not several. Saving
 * "Rent & Parking" again — a raise, or an accidental double-submit — supersedes
 * the earlier entry from its start month on, instead of stacking beside it.
 * Every entry used to inject its own estimated row, so a bill saved twice was
 * counted twice in every total, forever.
 *
 * Returns one timeline per bill, oldest start first.
 */
function baselineTimelines(baselines: RecurringBaseline[]): RecurringBaseline[][] {
  const groups = new Map<string, RecurringBaseline[]>();
  for (const b of baselines) {
    const key = `${b.name.trim().toLowerCase()}|${b.category}`;
    const group = groups.get(key);
    if (group) group.push(b);
    else groups.set(key, [b]);
  }
  // Stable sort keeps insertion order within one start month, so the most
  // recently saved of two identical entries is the one that wins.
  return [...groups.values()].map((g) =>
    [...g].sort((a, b) => a.startMonth.localeCompare(b.startMonth)),
  );
}

/** The entry of a timeline in force during month `m`, or null before it starts. */
function baselineAt(timeline: RecurringBaseline[], m: string): RecurringBaseline | null {
  let current: RecurringBaseline | null = null;
  for (const b of timeline) {
    if (b.startMonth > m) break;
    current = b;
  }
  // An ended revision must not revive a superseded older amount.
  return current?.endMonth && current.endMonth < m ? null : current;
}

/** Active revisions use the same dates in spending and the Bilt estimate. */
export function activeBaselines(baselines: RecurringBaseline[], month: string): RecurringBaseline[] {
  return baselineTimelines(baselines).map((timeline) => baselineAt(timeline, month))
    .filter((bill): bill is RecurringBaseline => bill !== null);
}

export function isHousingBaseline(bill: RecurringBaseline): boolean {
  return bill.category === "RENT_AND_UTILITIES" && /\b(rent|housing|mortgage)\b/i.test(bill.name);
}

/** Fill missing bills with estimates. A matched charge uses its actual amount,
 * even when it is prorated or split. Estimates never top up a posted bill. */
export function injectBaselines(state: AppState): AppState {
  const transactions = state.transactions.filter((t) => !isSyntheticBaseline(t));
  const raw = transactions.length === state.transactions.length ? state : { ...state, transactions };
  const timelines = baselineTimelines(state.baselines ?? []);
  if (!timelines.length) return raw;
  const months = availableMonths(raw);
  if (!months.length) return raw;
  const earliest = months[0];
  const latest = months[months.length - 1];
  const currency = state.accounts[0]?.currency ?? "USD";
  // A posted bill blocks an estimate even if a refund also posts this month.
  // Refund timing cannot prove which billing period needs a replacement charge.
  const posted = transactions.filter((t) => t.amount > 0 && isSpend(t));
  const synthetic: Transaction[] = [];

  let month = earliest;
  for (let guard = 0; month <= latest && guard < 600; guard++, month = nextMonth(month)) {
    const active = activeBaselines(state.baselines, month);
    const housingCount = active.filter(isHousingBaseline).length;
    const covered = new Set<string>();
    for (const t of posted) {
      if (monthKey(t.date) !== month) continue;
      const description = normalizeMerchant(`${t.name} ${t.merchantName ?? ""} ${t.categoryDetailed ?? ""}`);
      const words = new Set(description.split(" "));
      const scores = active.map((b) => {
        if (effectiveCategory(t) !== b.category) return 0;
        if (isHousingBaseline(b) && !isHousingTransaction(t)) return 0;
        const tokens = normalizeMerchant(b.name).split(" ")
          .filter((word) => word && !["and", "monthly", "bill", "payment", "unit"].includes(word));
        if (tokens.length && tokens.every((word) => words.has(word))) return 100 + tokens.length;
        return isHousingBaseline(b) && housingCount === 1 && isHousingTransaction(t) ? 10 : 0;
      });
      const best = Math.max(0, ...scores);
      const matches = active.filter((_, i) => best > 0 && scores[i] === best);
      // Ambiguous matches stay estimated. Never reuse one charge for two bills.
      if (matches.length === 1) covered.add(matches[0].id);
    }
    for (const b of active) {
      if (covered.has(b.id)) continue;
      synthetic.push({
        id: `baseline_${b.id}_${month}`,
        accountId: BASELINE_ACCOUNT_ID,
        amount: b.amount,
        currency,
        date: `${month}-01`,
        name: `${b.name} (estimated)`,
        merchantName: b.name,
        pending: false,
        categoryPrimary: b.category,
        categoryDetailed: null,
        paymentChannel: null,
        source: "manual",
        userCategory: null,
        note: "Estimated recurring baseline; no matching posted charge",
        hidden: false,
      });
    }
  }
  if (!synthetic.length) return raw;
  return {
    ...raw,
    transactions: [...transactions, ...synthetic].sort((a, b) => b.date.localeCompare(a.date)),
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
    if (t.amount > 0) row.count += 1;
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
  const months = comp.length;
  const grand = comp.reduce((a, c) => a + c.total, 0);

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
    monthlyAvg: months ? h.total / months : 0,
    share: grand ? h.total / grand : 0,
  }));
  habits.sort((a, b) => b.total - a.total);
  return {
    habits,
    months,
    avgMonthlyTotal: months ? grand / months : 0,
  };
}

export interface MerchantSpend {
  name: string;
  total: number;
  count: number;
}

/**
 * Real payees only. The synthetic "(estimated)" baseline rows are not merchants
 * you ever transacted with, and the Activity feed filters them out of the raw
 * ledger — leaving them in here produced tiles that drilled through to an empty
 * list. They still count in category totals, the donut, and habits.
 */
export function topMerchants(
  state: AppState,
  month?: string,
  limit = 8,
): MerchantSpend[] {
  const acctName = new Map(state.accounts.map((a) => [a.id, a.name]));
  const map = new Map<string, MerchantSpend>();
  for (const t of state.transactions) {
    if (isSyntheticBaseline(t)) continue;
    if (!isSpend(t)) continue;
    if (month && monthKey(t.date) !== month) continue;
    const name = displayPayee(t.merchantName, t.name, acctName.get(t.accountId));
    if (!map.has(name)) map.set(name, { name, total: 0, count: 0 });
    const row = map.get(name)!;
    row.total += t.amount;
    if (t.amount > 0) row.count += 1;
  }
  return [...map.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}

/** One merchant's spend within a category for the focused detail view. */
export interface CategoryMerchant {
  name: string;
  total: number;
  count: number;
  prevTotal: number; // same merchant, previous available month
  deltaPct: number | null; // vs prev month (null when no prior spend)
  transactions: Transaction[]; // this month's charges, newest first
}

/** Everything the category drill-down screen renders, derived server-side. */
export interface CategoryDetailData {
  category: string;
  label: string;
  glyph: string;
  color: string;
  month: string;
  prevMonth: string | null;
  total: number;
  count: number;
  prevTotal: number | null; // category total in prev month
  deltaPct: number | null; // category vs prev month
  avgMonthly: number; // category average per active month (window)
  vsAvgPct: number | null; // this month vs that average
  shareOfMonth: number; // fraction of the month's total spend (0..1)
  merchants: CategoryMerchant[]; // biggest-spend first
  biggest: Transaction[]; // largest single charges, up to 5
  recurring: RecurringStream[]; // active subscriptions/bills in this category
}

/**
 * Deep-dive on one spending category for one month — the "where is this going
 * and what can I cut?" view. Groups the category's charges by merchant (with a
 * vs-last-month delta each), surfaces the biggest single charges, the recurring
 * bills that live here, and how the month compares to the running average.
 */
export function categoryDetail(
  state: AppState,
  category: string,
  month: string,
): CategoryDetailData {
  const acctName = new Map(state.accounts.map((a) => [a.id, a.name]));
  const meta = categoryMeta(category);

  const months = availableMonths(state);
  const idx = months.indexOf(month);
  const prevMonth = idx > 0 ? months[idx - 1] : null;

  const inCategory = (t: Transaction) =>
    isSpend(t) && effectiveCategory(t) === category;
  const payee = (t: Transaction) =>
    displayPayee(t.merchantName, t.name, acctName.get(t.accountId));

  // This month's charges, grouped by merchant.
  const groups = new Map<string, Transaction[]>();
  let total = 0;
  let count = 0;
  for (const t of state.transactions) {
    if (!inCategory(t) || monthKey(t.date) !== month) continue;
    total += t.amount;
    if (t.amount > 0) count += 1;
    const name = payee(t);
    (groups.get(name) ?? groups.set(name, []).get(name)!).push(t);
  }

  // Previous month's per-merchant totals, for the delta arrows.
  const prevByMerchant = new Map<string, number>();
  let prevTotal = 0;
  for (const t of state.transactions) {
    if (!prevMonth || !inCategory(t) || monthKey(t.date) !== prevMonth) continue;
    prevTotal += t.amount;
    const name = payee(t);
    prevByMerchant.set(name, (prevByMerchant.get(name) ?? 0) + t.amount);
  }

  const merchants: CategoryMerchant[] = [...groups.entries()]
    .map(([name, txns]) => {
      const mTotal = txns.reduce((a, t) => a + t.amount, 0);
      const mPrev = prevByMerchant.get(name) ?? 0;
      return {
        name,
        total: mTotal,
        count: txns.filter((t) => t.amount > 0).length,
        prevTotal: mPrev,
        deltaPct: mPrev > 0 ? ((mTotal - mPrev) / mPrev) * 100 : null,
        transactions: txns.sort((a, b) => b.date.localeCompare(a.date)),
      };
    })
    .sort((a, b) => b.total - a.total);

  const biggest = merchants
    .flatMap((m) => m.transactions)
    .filter((t) => t.amount > 0 && !isSyntheticBaseline(t))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Month's grand spend (for share) and the category's running average.
  const monthTotal = spendingByCategory(state, month).reduce(
    (a, c) => a + c.total,
    0,
  );
  const habit = categoryHabits(state, Infinity).habits.find(
    (h) => h.category === category,
  );
  const avgMonthly = habit?.monthlyAvg ?? 0;

  const recurring = state.recurring.filter(
    (s) =>
      s.isActive &&
      s.type === "outflow" &&
      !isTransferStream(s) &&
      categoryMeta(s.categoryPrimary).key === category,
  );

  return {
    category,
    label: meta.label,
    glyph: meta.glyph,
    color: meta.color,
    month,
    prevMonth,
    total,
    count,
    prevTotal: prevMonth ? prevTotal : null,
    deltaPct: prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null,
    avgMonthly,
    vsAvgPct: avgMonthly > 0 ? ((total - avgMonthly) / avgMonthly) * 100 : null,
    shareOfMonth: monthTotal > 0 ? total / monthTotal : 0,
    merchants,
    biggest,
    recurring,
  };
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
        name: isSyntheticBaseline(t) ? "Estimated fixed bills" : names.get(t.accountId) ?? "Account",
        total: 0,
        count: 0,
      });
    const r = map.get(t.accountId)!;
    r.total += t.amount;
    if (t.amount > 0) r.count += 1;
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
export function dailySpending(state: AppState, month: string, asOf = todayKey()): DailySpending {
  const [y, mo] = month.split("-").map(Number);
  const daysInMonth = new Date(y, mo, 0).getDate();
  const days: DaySpend[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    date: `${month}-${String(i + 1).padStart(2, "0")}`,
    total: 0,
  }));
  let total = 0;
  const currentMonth = asOf.slice(0, 7);
  const throughDay = month < currentMonth ? daysInMonth : month === currentMonth
    ? Math.min(daysInMonth, Number(asOf.slice(8, 10))) : 0;
  let fixed = 0;
  for (const t of state.transactions) {
    if (!isSpend(t)) continue;
    if (monthKey(t.date) !== month) continue;
    if (t.date > asOf) continue;
    const d = Number(t.date.slice(8, 10));
    if (d >= 1 && d <= daysInMonth) {
      days[d - 1].total += t.amount;
      total += t.amount;
      if (isSyntheticBaseline(t) || isHousingTransaction(t)) fixed += t.amount;
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
    projected: month === currentMonth && throughDay > 0
      ? fixed + ((total - fixed) / throughDay) * daysInMonth : null,
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

function addInterval(date: string, freq: string, anchorDate = date): string {
  const d = new Date(date + "T00:00:00Z");
  if (freq === "WEEKLY") d.setUTCDate(d.getUTCDate() + 7);
  else if (freq === "BIWEEKLY") d.setUTCDate(d.getUTCDate() + 14);
  else if (freq === "SEMI_MONTHLY") d.setUTCDate(d.getUTCDate() + 15);
  else {
    const anchorDay = Number(anchorDate.slice(8, 10));
    const month = d.getUTCMonth() + (freq === "ANNUALLY" ? 12 : 1);
    const lastDay = new Date(Date.UTC(d.getUTCFullYear(), month + 1, 0)).getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(month);
    d.setUTCDate(Math.min(anchorDay, lastDay));
  }
  return d.toISOString().slice(0, 10);
}

function dayDiff(from: string, to: string): number {
  return Math.round(
    (Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000,
  );
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Map a typical day-gap to a Plaid-style cadence, or null if it's not a clean one. */
function cadenceFromGap(
  days: number,
): { freq: RecurringFrequency; interval: number } | null {
  if (days >= 6 && days <= 8) return { freq: "WEEKLY", interval: 7 };
  if (days >= 12 && days <= 16) return { freq: "BIWEEKLY", interval: 14 };
  if (days >= 26 && days <= 35) return { freq: "MONTHLY", interval: 30 };
  if (days >= 350 && days <= 385) return { freq: "ANNUALLY", interval: 365 };
  return null; // bimonthly/quarterly have no enum — skip rather than mislabel
}

/**
 * Our own recurring detector — a fallback for everything Plaid's recurring
 * product misses (short history, too few occurrences, slightly inconsistent
 * naming). Groups posted, non-transfer transactions by account + normalized
 * merchant, then promotes a group to a stream when it shows a regular cadence
 * and steady amount. Streams Plaid already supplies are skipped, so this only
 * adds only missing streams. The supplied date controls active status.
 */
export function detectRecurringStreams(state: AppState, today = todayKey()): RecurringStream[] {
  const neutralized = refundMatchedIds(state);

  // account + normalized-merchant keys Plaid already covers with a *shown*
  // stream — never duplicate those. We deliberately ignore Plaid streams that
  // get filtered out as transfers: Plaid sometimes mislabels a real
  // subscription's stream category as TRANSFER_OUT (e.g. "MASSIVE.COM DATA API"
  // whose transactions are GENERAL_SERVICES), which hides it everywhere. Letting
  // those through here means our detector — which reads the category from the
  // actual transactions — can recover them.
  const plaidKeys = new Set<string>();
  for (const r of state.recurring) {
    if (isTransferStream(r)) continue;
    const m = normalizeMerchant(r.merchantName || r.description || "");
    if (m) plaidKeys.add(`${r.accountId}:${m}`);
  }

  // Group eligible transactions by account + normalized merchant.
  const groups = new Map<string, Transaction[]>();
  for (const t of state.transactions) {
    if (t.pending || t.hidden || isSyntheticBaseline(t)) continue;
    if (t.date > today) continue;
    if (t.amount === 0 || neutralized.has(t.id)) continue;
    if (t.amount < 0 && !isIncome(t)) continue;
    if (TRANSFER_CATEGORIES.has(effectiveCategory(t))) continue;
    if (isInternalPayment(t.name, t.merchantName)) continue;
    const m = normalizeMerchant(t.merchantName || t.name);
    if (!m) continue;
    const key = `${t.accountId}:${m}`;
    const g = groups.get(key);
    if (g) g.push(t);
    else groups.set(key, [t]);
  }

  const out: RecurringStream[] = [];
  for (const [key, all] of groups) {
    if (plaidKeys.has(key)) continue;
    // A single merchant can carry both charges and refunds; take the dominant sign.
    const outflow = all.filter((t) => t.amount > 0);
    const inflow = all.filter((t) => t.amount < 0);
    const type: "inflow" | "outflow" =
      outflow.length >= inflow.length ? "outflow" : "inflow";
    const txns = (type === "outflow" ? outflow : inflow).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    if (txns.length < 3) continue; // need ≥3 to infer a cadence

    // Gaps between consecutive charges → cadence from their median.
    const gaps: number[] = [];
    for (let i = 1; i < txns.length; i++)
      gaps.push(dayDiff(txns[i - 1].date, txns[i].date));
    const cad = cadenceFromGap(median(gaps));
    if (!cad) continue;

    // Regularity: most gaps near the cadence (±35%, min ±4 days).
    const tol = Math.max(cad.interval * 0.35, 4);
    const regular = gaps.filter((d) => Math.abs(d - cad.interval) <= tol).length;
    if (regular < Math.ceil(gaps.length * 0.6)) continue;

    // Steady amount: low spread (a fixed sub) or near-identical dollars.
    const amts = txns.map((t) => Math.abs(t.amount));
    const avg = amts.reduce((a, b) => a + b, 0) / amts.length;
    const sd = Math.sqrt(
      amts.reduce((a, b) => a + (b - avg) ** 2, 0) / amts.length,
    );
    const spread = Math.max(...amts) - Math.min(...amts);
    if (!(avg > 0 && (sd / avg <= 0.25 || spread <= 2))) continue;

    const last = txns[txns.length - 1];
    const first = txns[0];
    const catCount = new Map<string, number>();
    for (const t of txns) {
      const c = effectiveCategory(t);
      catCount.set(c, (catCount.get(c) ?? 0) + 1);
    }
    const categoryPrimary = [...catCount.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0][0];
    const sign = type === "outflow" ? 1 : -1;

    out.push({
      id: `local:${key}`,
      accountId: last.accountId,
      description: last.name,
      merchantName: last.merchantName ?? last.name,
      categoryPrimary,
      frequency: cad.freq,
      averageAmount: sign * avg,
      lastAmount: sign * Math.abs(last.amount),
      firstDate: first.date,
      lastDate: last.date,
      predictedNextDate: addInterval(last.date, cad.freq),
      isActive: dayDiff(last.date, today) <= cad.interval * 2 + 7,
      type,
      source: last.source,
      inferred: true,
    });
  }

  return out;
}

/** Plaid's streams plus everything our own detector recovered that Plaid missed. */
export function allRecurringStreams(state: AppState, today = todayKey()): RecurringStream[] {
  return [...state.recurring, ...detectRecurringStreams(state, today)];
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
  const acctName = new Map(state.accounts.map((a) => [a.id, a.name]));
  const streams = allRecurringStreams(state, today).filter(isBillStream);
  for (const s of streams) {
    let date = s.predictedNextDate && s.predictedNextDate >= today
      ? s.predictedNextDate
      : s.lastDate;
    let predicted = !(s.predictedNextDate && s.predictedNextDate >= today);
    if (!date) continue;
    let guard = 0;
    while (date < today && guard < 60) {
      date = addInterval(date, s.frequency, s.lastDate);
      predicted = true;
      guard++;
    }
    // Count each occurrence in the horizon, not only the next weekly charge.
    let occurrence = 0;
    while (date >= today && dayDiff(today, date) <= Math.max(withinDays, 30) && occurrence < 400) {
      bills.push({
        id: `${s.id}:${date}`,
        name: displayPayee(s.merchantName, s.description, acctName.get(s.accountId)),
        categoryPrimary: s.categoryPrimary,
        amount: Math.abs(s.lastAmount || s.averageAmount),
        frequency: s.frequency,
        nextDate: date,
        daysUntil: dayDiff(today, date),
        predicted,
      });
      date = addInterval(date, s.frequency, s.lastDate);
      predicted = true;
      occurrence++;
    }
  }
  bills.sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  const within = bills.filter((b) => b.daysUntil <= withinDays);
  return {
    bills: within,
    dueSoonTotal: bills
      .filter((b) => b.daysUntil <= 30)
      .reduce((a, b) => a + b.amount, 0),
    monthlyTotal: streams.reduce((sum, s) => sum + monthlyEquivalent(s), 0),
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

/** Today as yyyy-mm-dd in the app's configured timezone (UTC fallback). */
export function todayKey(): string {
  const tz = process.env.APP_TIMEZONE;
  if (!tz) return new Date().toISOString().slice(0, 10);
  try {
    // en-CA formats as yyyy-mm-dd.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Reconstruct a daily net-worth history from transaction flow, anchored to the
 * current balances. Plaid only records a point-in-time balance, so we walk the
 * posted transactions backward from "now": each transaction moved net worth by
 * `−amount` (positive amount = outflow), independent of account type. Asset and
 * liability sides are tracked separately so the tooltip's assets/owed stay real.
 *
 * Real recorded snapshots (which capture exact balances + manual-entry timing)
 * take precedence on any date they exist; the reconstruction fills everything
 * before them, giving the chart months — often a year+ — of history immediately.
 */
export function netWorthHistory(state: AppState, today: string): NetWorthSnapshot[] {
  const nw = computeNetWorth(state);
  const liabAccts = new Set(
    state.accounts.filter((a) => LIABILITY_TYPES.has(a.type)).map((a) => a.id),
  );

  // Net per-day flow, split by asset vs liability side. Also tally real income
  // and discretionary spending per day (same rules as the cash-flow views) so
  // the chart can show what drove each move.
  const dayAsset = new Map<string, number>();
  const dayLiab = new Map<string, number>();
  const dayIncome = new Map<string, number>();
  const daySpend = new Map<string, number>();
  for (const t of state.transactions) {
    if (t.pending || isSyntheticBaseline(t)) continue;
    const bucket = liabAccts.has(t.accountId) ? dayLiab : dayAsset;
    bucket.set(t.date, (bucket.get(t.date) ?? 0) + t.amount);
    if (isIncome(t))
      dayIncome.set(t.date, (dayIncome.get(t.date) ?? 0) + -t.amount);
    else if (isSpend(t))
      daySpend.set(t.date, (daySpend.get(t.date) ?? 0) + t.amount);
  }

  const dates = [...new Set([...dayAsset.keys(), ...dayLiab.keys()])].sort();
  if (dates.length === 0) return state.snapshots;

  // Walk backward accumulating the flow that happened *after* each date, so each
  // point reflects end-of-day balances on that date.
  const byDate = new Map<string, NetWorthSnapshot>();
  let aFut = 0;
  let lFut = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    const d = dates[i];
    const totalAssets = nw.totalAssets + aFut;
    const totalLiabilities = nw.totalLiabilities - lFut;
    byDate.set(d, {
      date: d,
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    });
    aFut += dayAsset.get(d) ?? 0;
    lFut += dayLiab.get(d) ?? 0;
  }

  // Pin the latest point to today's actual figures.
  byDate.set(today, {
    date: today,
    totalAssets: nw.totalAssets,
    totalLiabilities: nw.totalLiabilities,
    netWorth: nw.netWorth,
  });

  // Real snapshots win on the dates they cover (exact balances, manual entries).
  for (const s of state.snapshots) byDate.set(s.date, { ...s });

  // Attach each day's income/spending flow to its point.
  for (const [d, snap] of byDate) {
    snap.income = dayIncome.get(d) ?? 0;
    snap.spending = daySpend.get(d) ?? 0;
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
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
  date: string; // earliest posted date in the group
  /** 2+ identical posted charges: same account, merchant, amount, and nearby posted dates. */
  transactions: Transaction[];
}

/** Preserve merchant names; remove explicit store/reference suffixes only. */
function normalizeMerchant(s: string): string {
  return s.normalize("NFKC").toLowerCase()
    .replace(/\s*#\s*\d+\s*$/u, "")
    .replace(/\s+store\s+\d+\s*$/iu, "")
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .replace(/\s+/g, " ").trim();
}

/** Same-account, same-amount purchases posted within one day are review candidates. */
export function findPossibleDuplicates(state: AppState): DuplicateGroup[] {
  const neutralized = refundMatchedIds(state);
  const accountNames = new Map(state.accounts.map((a) => [a.id, a.name]));
  const buckets = new Map<string, Transaction[]>();
  for (const t of state.transactions) {
    if (t.amount <= 0 || neutralized.has(t.id) || !isSpend(t) || isSyntheticBaseline(t)) continue;
    if (isInternalPayment(t.name, t.merchantName)) continue;
    const merchant = normalizeMerchant(t.merchantName || t.name);
    if (!merchant) continue;
    const key = JSON.stringify([t.accountId, t.currency, merchant, t.amount.toFixed(2)]);
    const bucket = buckets.get(key) ?? [];
    bucket.push(t);
    buckets.set(key, bucket);
  }
  const groups: DuplicateGroup[] = [];
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    let start = 0;
    while (start < bucket.length) {
      let end = start + 1;
      const firstDate = Date.parse(`${bucket[start].date}T00:00:00Z`);
      while (end < bucket.length && Date.parse(`${bucket[end].date}T00:00:00Z`) - firstDate <= 86_400_000) end++;
      const transactions = bucket.slice(start, end);
      if (transactions.length >= 2) {
        const first = transactions[0];
        groups.push({
          merchant: displayPayee(first.merchantName, first.name, accountNames.get(first.accountId)),
          amount: first.amount,
          accountId: first.accountId,
          date: first.date,
          transactions,
        });
      }
      start = end;
    }
  }
  return groups.sort((a, b) => b.date.localeCompare(a.date));
}
