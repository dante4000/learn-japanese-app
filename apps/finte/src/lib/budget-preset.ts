import { calendarMonths, isIncome, isSpend, isSyntheticBaseline } from "./analytics";
import { CATEGORIES, isInternalPayment, resolveCategoryKey } from "./categories";
import { filterStateByCurrency } from "./currency";
import { goalProgress } from "./planning";
import type { AppState, BudgetPreference } from "./types";

const cents = (value: number) => Math.round(value * 100);
const ESSENTIAL = new Set(["RENT_AND_UTILITIES", "MEDICAL", "BANK_FEES", "GOVERNMENT_AND_NON_PROFIT", "GENERAL_SERVICES", "TRANSPORTATION"]);
export interface BudgetBasis {
  currency: string;
  preference?: BudgetPreference;
  months: string[];
  missingMonths: string[];
  income: number;
  debtPayments: number;
  goalReserve: number;
  goals: { name: string; monthly: number; dated: boolean }[];
  categories: { category: string; average: number; essential: boolean }[];
}

/** Use three closed calendar months. Never extrapolate an incomplete payday month. */
export function budgetBasis(full: AppState, currency: string, today: string): BudgetBasis {
  const state = filterStateByCurrency(full, currency);
  const end = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
  const first = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 3, 1)).toISOString().slice(0, 7);
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
  const months = calendarMonths(first, last);
  const transactions = state.transactions.filter((t) => months.includes(t.date.slice(0, 7)) && !t.pending && !t.hidden);
  const observed = months.filter((month) => transactions.some((t) => !isSyntheticBaseline(t) && t.date.startsWith(month)));
  const denominator = observed.length || 1;
  const sample = transactions.filter((t) => observed.includes(t.date.slice(0, 7)));
  const income = cents(sample.filter(isIncome).reduce((sum, t) => sum - t.amount, 0) / denominator) / 100;
  const debtPayments = cents(Math.max(0, sample.filter((t) => resolveCategoryKey(t) === "LOAN_PAYMENTS" && !isInternalPayment(t.name, t.merchantName)).reduce((sum, t) => sum + t.amount, 0)) / denominator) / 100;
  const goals = (state.goals ?? []).filter((g) => g.saved < g.target).map((g) => ({ name: g.name, monthly: Math.max(goalProgress(g, today).needed ?? 0, g.monthlyContribution), dated: g.targetDate !== null }));
  return {
    currency, preference: state.budgetPreferences?.find((p) => p.currency === currency), months: observed, missingMonths: months.filter((m) => !observed.includes(m)), income, debtPayments,
    goals, goalReserve: goals.reduce((sum, g) => sum + cents(g.monthly), 0) / 100,
    categories: Object.values(CATEGORIES).filter((c) => c.isSpending).map((c) => ({ category: c.key, essential: ESSENTIAL.has(c.key), average: cents(Math.max(0, sample.filter((t) => isSpend(t) && (CATEGORIES[resolveCategoryKey(t)] ? resolveCategoryKey(t) : "OTHER") === c.key).reduce((sum, t) => sum + t.amount, 0)) / denominator) / 100 })),
  };
}

/** Allocate whole cents. Never hide an essential-cost shortfall by scaling it away. */
export function fitBudget(basis: BudgetBasis, income: number, savings: number) {
  const earned = cents(Math.max(0, income));
  const reserve = cents(Math.max(basis.goalReserve, savings));
  const debt = cents(basis.debtPayments);
  const essential = basis.categories.filter((c) => c.essential).reduce((sum, c) => sum + cents(c.average), 0);
  const flexible = basis.categories.filter((c) => !c.essential).reduce((sum, c) => sum + cents(c.average), 0);
  const capacity = Math.max(0, earned - reserve - debt - essential);
  const allocated = Math.min(capacity, flexible);
  const rows = basis.categories.map((c) => ({ category: c.category, units: c.essential ? cents(c.average) : flexible ? Math.floor(cents(c.average) * allocated / flexible) : 0, essential: c.essential, average: c.average }));
  let remainder = allocated - rows.filter((r) => !r.essential).reduce((sum, r) => sum + r.units, 0);
  for (const row of rows) if (remainder > 0 && !row.essential && row.average > 0) { row.units++; remainder--; }
  const total = rows.reduce((sum, r) => sum + r.units, 0);
  return { rows: rows.map(({ units, ...row }) => ({ ...row, limit: units / 100 })), total: total / 100, savings: reserve / 100, debtPayments: debt / 100, remaining: (earned - reserve - debt - total) / 100, shortfall: Math.max(0, reserve + debt + essential - earned) / 100 };
}
