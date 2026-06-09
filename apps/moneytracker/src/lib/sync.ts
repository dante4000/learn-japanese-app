import { AppState, Account, Item, Transaction } from "./types";
import { SyncResult } from "./providers/types";
import { plaidSync } from "./providers/plaid";
import { recordSnapshot } from "./analytics";

// Merges normalized provider results into the app state. User-authored fields
// (category override, note, hidden) are preserved across re-syncs — raw bank
// data never clobbers your edits.

function upsertAccounts(state: AppState, accounts: Account[]): void {
  for (const acct of accounts) {
    const idx = state.accounts.findIndex((a) => a.id === acct.id);
    if (idx === -1) state.accounts.push(acct);
    else state.accounts[idx] = { ...state.accounts[idx], ...acct };
  }
}

function carryOverEdits(prev: Transaction | undefined, next: Transaction): Transaction {
  if (!prev) return next;
  return {
    ...next,
    userCategory: prev.userCategory,
    note: prev.note,
    hidden: prev.hidden,
  };
}

export function applySyncResult(
  state: AppState,
  item: Item,
  result: SyncResult,
): void {
  upsertAccounts(state, result.accounts);

  const byId = new Map(state.transactions.map((t) => [t.id, t]));
  for (const t of [...result.added, ...result.modified]) {
    byId.set(t.id, carryOverEdits(byId.get(t.id), t));
  }
  for (const id of result.removed) byId.delete(id);
  state.transactions = [...byId.values()].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  if (result.recurring.length) {
    const itemAccountIds = new Set(
      state.accounts.filter((a) => a.itemId === item.id).map((a) => a.id),
    );
    // Replace recurring streams belonging to this item's accounts.
    state.recurring = state.recurring.filter(
      (r) => !itemAccountIds.has(r.accountId),
    );
    state.recurring.push(...result.recurring);
  }

  item.cursor = result.cursor;
  item.lastSyncedAt = new Date().toISOString();
  item.status = "healthy";
  item.error = null;
  if (result.institutionName) item.institutionName = result.institutionName;
}

/** Sync one Plaid item, recording its outcome on the item. */
export async function syncItem(state: AppState, item: Item): Promise<void> {
  if (item.provider !== "plaid") return; // csv/manual items don't auto-sync
  try {
    const result = await plaidSync(item);
    applySyncResult(state, item, result);
  } catch (err) {
    item.status = "error";
    item.error = err instanceof Error ? err.message : String(err);
  }
}

/** Sync every Plaid item and record today's net-worth snapshot. */
export async function syncAll(state: AppState): Promise<void> {
  const plaidItems = state.items.filter((i) => i.provider === "plaid");
  for (const item of plaidItems) await syncItem(state, item);
  recordSnapshot(state, new Date().toISOString().slice(0, 10));
}
