import { AppState } from "./types";

// Global account filter. The selected account id lives in a plain cookie —
// it's a viewing preference, not a secret — written by the AccountPicker on
// the client and read by every server page. This module stays pure (no
// next/headers) so both sides can import it.

/** Cookie holding the globally-selected account id. Absent/empty = all. */
export const ACCOUNT_COOKIE = "vault_account";

/**
 * Narrow the app state to a single account so every analytics function
 * computes per-account figures unchanged. Manual entries, net-worth snapshots,
 * and recurring baselines are global (not attributable to one account), so
 * they're emptied while filtered. An unknown id (e.g. a since-deleted account)
 * returns the state untouched.
 */
export function filterStateByAccount(
  state: AppState,
  accountId: string | null | undefined,
): AppState {
  if (!accountId) return state;
  const account = state.accounts.find((a) => a.id === accountId);
  if (!account) return state;
  return {
    ...state,
    items: state.items.filter((i) => i.id === account.itemId),
    accounts: [account],
    transactions: state.transactions.filter((t) => t.accountId === accountId),
    recurring: state.recurring.filter((r) => r.accountId === accountId),
    manualEntries: [],
    baselines: [],
    snapshots: [],
  };
}
