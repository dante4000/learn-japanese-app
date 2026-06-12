import { Item, ItemBundle, Transaction } from "./types";
import { SyncResult } from "./providers/types";
import { plaidSync } from "./providers/plaid";
import { recordSnapshot } from "./analytics";
import {
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
  for (const t of [...result.added, ...result.modified]) {
    byId.set(t.id, carryOverEdits(byId.get(t.id), t));
  }
  for (const id of result.removed) byId.delete(id);
  const transactions = [...byId.values()].sort((a, b) =>
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
    recurring: result.recurring,
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
  const prev = await loadItemBundle(item.id);
  try {
    const result = await plaidSync(item);
    await saveItemBundle(buildBundle(item, prev, result));
    return { status: "healthy", error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = failureStatus(err);
    if (prev) {
      prev.item.status = status;
      prev.item.error = message;
      await saveItemBundle(prev);
    }
    return { status, error: message };
  }
}

/**
 * Today's date as yyyy-mm-dd, in APP_TIMEZONE if set (otherwise UTC). Without
 * this, an evening sync in the US records the snapshot under tomorrow's date.
 */
function todayKey(): string {
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

/** Recompute today's net-worth snapshot from the full (merged) state. */
export async function updateSnapshot(): Promise<void> {
  const state = await loadState();
  recordSnapshot(state, todayKey());
  const meta = await loadMeta();
  meta.snapshots = state.snapshots;
  await saveMeta(meta);
}

export interface SyncAllResult {
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
  await updateSnapshot();
  return { items: plaidItems.length, errors };
}
