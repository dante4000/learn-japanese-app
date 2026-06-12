import { cookies } from "next/headers";
import { loadStateCached } from "./store";
import { ACCOUNT_COOKIE, filterStateByAccount } from "./account-filter";
import { Account, AppState } from "./types";

/**
 * App state scoped to the account selected in the global picker. `focus` is
 * the selected account, or null when viewing all (including when the cookie
 * points at an account that no longer exists).
 */
export async function loadScopedState(): Promise<{
  state: AppState;
  focus: Account | null;
}> {
  const full = await loadStateCached();
  const id = (await cookies()).get(ACCOUNT_COOKIE)?.value;
  const focus = id ? (full.accounts.find((a) => a.id === id) ?? null) : null;
  return { state: focus ? filterStateByAccount(full, focus.id) : full, focus };
}
