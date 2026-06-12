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
    accounts: result.accounts,
    transactions,
    recurring: result.recurring,
  };
}

export interface ItemSyncOutcome {
  status: "healthy" | "error";
  error: string | null;
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
    if (prev) {
      prev.item.status = "error";
      prev.item.error = message;
      await saveItemBundle(prev);
    }
    return { status: "error", error: message };
  }
}

/** Recompute today's net-worth snapshot from the full (merged) state. */
export async function updateSnapshot(): Promise<void> {
  const state = await loadState();
  recordSnapshot(state, new Date().toISOString().slice(0, 10));
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
    if (outcome.status === "error")
      errors.push({ institution: item.institutionName, error: outcome.error });
  }
  await updateSnapshot();
  return { items: state.items.length, errors };
}
