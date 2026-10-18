import type { AppState } from "./types";

export const CURRENCY_COOKIE = "finacetracker_currency";
export const entryCurrency = (entry: { currency?: string }) => entry.currency ?? "USD";

export function availableCurrencies(state: AppState): string[] {
  return [...new Set([
    ...state.accounts.map(entryCurrency), ...state.transactions.map(entryCurrency),
    ...state.manualEntries.map(entryCurrency), ...state.baselines.map(entryCurrency),
  ])].sort();
}

export function selectedCurrency(state: AppState, requested?: string | null): string {
  const currencies = availableCurrencies(state);
  if (requested && /^[A-Z]{3}$/.test(requested)) return requested;
  return state.currency ?? (currencies.includes("USD") ? "USD" : currencies[0] ?? "USD");
}

/** A viewing scope, never an exchange-rate conversion. Legacy global values are USD. */
export function filterStateByCurrency(state: AppState, currency: string): AppState {
  const accounts = state.accounts.filter((a) => a.currency === currency);
  const ids = new Set(accounts.map((a) => a.id));
  return {
    ...state, currency, accounts,
    transactions: state.transactions.filter((t) => t.currency === currency),
    recurring: state.recurring.filter((r) => ids.has(r.accountId)),
    manualEntries: state.manualEntries.filter((m) => entryCurrency(m) === currency),
    baselines: state.baselines.filter((b) => entryCurrency(b) === currency),
    snapshots: state.snapshots.filter((s) => entryCurrency(s) === currency),
    employerHousingSupport: currency === "USD" ? state.employerHousingSupport : null,
    biltConfig: currency === "USD" ? state.biltConfig : undefined,
  };
}
