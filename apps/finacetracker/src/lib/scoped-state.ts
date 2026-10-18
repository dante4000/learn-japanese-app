import { CURRENCY_COOKIE, filterStateByCurrency, selectedCurrency } from "./currency";
import { cookies } from "next/headers";
import { loadStateCached } from "./store";
import { LEGACY_ACCOUNT_COOKIE, ACCOUNT_COOKIE, filterStateByAccount } from "./account-filter";
import { Account, AppState } from "./types";

/**
 * App state scoped to the account selected in the global picker. `focus` is
 * the selected account, or null when viewing all (including when the cookie
 * points at an account that no longer exists).
 */
export async function loadScopedState(): Promise<{
  state: AppState;
  fullState: AppState;
  focus: Account | null;
}> {
  const full = await loadStateCached();
  const id = ((await cookies()).get(ACCOUNT_COOKIE)?.value ?? (await cookies()).get(LEGACY_ACCOUNT_COOKIE)?.value);
  const focus = id ? (full.accounts.find((a) => a.id === id) ?? null) : null;
  const currency = focus?.currency ?? selectedCurrency(full, (await cookies()).get(CURRENCY_COOKIE)?.value);
  return { state: filterStateByCurrency(focus ? filterStateByAccount(full, focus.id) : full, currency), fullState: full, focus };
}
