import { Item, ItemBundle, Transaction } from "./types";
import { SyncResult } from "./providers/types";
import { plaidSync } from "./providers/plaid";
import { csvHistoryOverlap } from "./providers/csv";
import { recordSnapshot, todayKey } from "./analytics";
import {
  StorageConflictError,
  loadItemBundle,
  saveItemBundle,
  loadState,
  loadMeta,
  saveMeta,
} from "./store";

// Builds and persists per-item bundles. User-authored fields (category
// override, note, hidden) are preserved across re-syncs — raw bank data never
// clobbers your edits. Each item is written independently, so syncing one bank
// can't lose another bank's data.

function carryOverEdits(
  prev: Transaction | undefined,
  next: Transaction,
): Transaction {
  if (!prev) return next;
  return {
    ...next,
    userCategory: prev.userCategory,
    note: prev.note,
    hidden: prev.hidden,
  };
}

/** Merge a provider sync result into a fresh bundle for `item`. */
export function buildBundle(
  item: Item,
  prev: ItemBundle | null,
  result: SyncResult,
): ItemBundle {
  const byId = new Map<string, Transaction>(
    (prev?.transactions ?? []).map((t) => [t.id, t]),
  );
  const previousById = new Map(byId);
  for (const t of [...result.added, ...result.modified]) {
    const pending = t.pendingTransactionId ? previousById.get(t.pendingTransactionId) : undefined;
    const previous = byId.get(t.id) ?? (
      pending?.pending && pending.accountId === t.accountId ? pending : undefined
    );
    byId.set(t.id, carryOverEdits(previous, t));
    if (!t.pending && pending?.pending && pending.accountId === t.accountId)
      byId.delete(pending.id);
  }
  for (const id of result.removed) byId.delete(id);
  // A provider backfill can reach previously imported CSV history. Stop before
  // advancing the cursor; equal amounts or names cannot prove row identity.
  const merged = [...byId.values()];
  const csvRows = merged.filter((t) => t.source === "csv");
  for (const accountId of new Set(csvRows.map((t) => t.accountId))) {
    if (csvHistoryOverlap(merged, csvRows, accountId).count > 0)
      throw new Error("Bank history overlaps CSV history in this account. Sync was stopped to prevent duplicate charges. Reconcile the overlapping imports before syncing again.");
  }
  const transactions = merged.sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  return {
    item: {
      ...item,
      cursor: result.cursor,
      lastSyncedAt: new Date().toISOString(),
      status: "healthy",
      error: null,
      institutionName: result.institutionName || item.institutionName,
    },
    // A sync reporting zero accounts is a provider hiccup, not every account
    // closing at once — keep the previous accounts rather than orphaning all
    // of the item's transactions (no name, no balance, unreachable by the
    // account filter).
    accounts: result.accounts.length ? result.accounts : (prev?.accounts ?? []),
    transactions,
    recurring: result.recurring ?? prev?.recurring ?? [],
  };
}

export interface ItemSyncOutcome {
  status: "healthy" | "needs_reauth" | "error";
  error: string | null;
}

/** Plaid error codes that mean the user must re-link, not that the sync broke. */
const REAUTH_CODES = new Set(["ITEM_LOGIN_REQUIRED", "PENDING_EXPIRATION"]);

function failureStatus(err: unknown): "needs_reauth" | "error" {
  const code = (err as { response?: { data?: { error_code?: string } } })
    ?.response?.data?.error_code;
  return code && REAUTH_CODES.has(code) ? "needs_reauth" : "error";
}

/** Sync one Plaid item and persist just its bundle. */
export async function syncOneItem(item: Item): Promise<ItemSyncOutcome> {
  if (item.provider !== "plaid") return { status: "healthy", error: null };
  try {
    const result = await plaidSync(item);
    const latest = await loadItemBundle(item.id);
    if (!latest) return { status: "error", error: "Connection was removed during sync" };
    if (latest.item.cursor !== item.cursor)
      return { status: "error", error: "Another sync changed this connection. Retry sync." };
    await saveItemBundle(buildBundle(latest.item, latest, result), latest);
    return { status: "healthy", error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = failureStatus(err);
    if (err instanceof StorageConflictError) return { status, error: message };
    const latest = await loadItemBundle(item.id);
    if (latest) {
      latest.item.status = status;
      latest.item.error = message;
      try {
        await saveItemBundle(latest);
      } catch (saveError) {
        if (!(saveError instanceof StorageConflictError)) throw saveError;
      }
    }
    return { status, error: message };
  }
}

/**
 * Today's date as yyyy-mm-dd, in APP_TIMEZONE if set (otherwise UTC). Without
 * this, an evening sync in the US records the snapshot under tomorrow's date.
 */
/** Recompute today's net-worth snapshot from the full (merged) state. */
export async function updateSnapshot(): Promise<void> {
  const state = await loadState();
  const today = todayKey();
  recordSnapshot(state, today);
  const snapshot = state.snapshots.find((s) => s.date === today)!;
  const meta = await loadMeta();
  meta.snapshots = [...meta.snapshots.filter((s) => s.date !== today), snapshot]
    .sort((a, b) => a.date.localeCompare(b.date));
  await saveMeta(meta);
}

/** A derived snapshot failure must not make a committed mutation look unsaved. */
export async function refreshSnapshotAfterMutation(
  refresh: () => Promise<void> = updateSnapshot,
): Promise<{ warning?: string }> {
  try {
    await refresh();
    return {};
  } catch {
    return { warning: "Changes saved. The net-worth snapshot could not refresh. Do not submit again; use Refresh to retry the snapshot." };
  }
}

export interface SyncAllResult {
  warning?: string;
  items: number;
  errors: { institution: string; error: string | null }[];
}

/** Sync every Plaid item (each written independently) + refresh the snapshot. */
export async function syncAll(): Promise<SyncAllResult> {
  const state = await loadState();
  const plaidItems = state.items.filter((i) => i.provider === "plaid");
  const errors: { institution: string; error: string | null }[] = [];
  for (const item of plaidItems) {
    const outcome = await syncOneItem(item);
    if (outcome.status !== "healthy")
      errors.push({ institution: item.institutionName, error: outcome.error });
  }
  const snapshot = await refreshSnapshotAfterMutation();
  return { items: plaidItems.length, errors, ...snapshot };
}
