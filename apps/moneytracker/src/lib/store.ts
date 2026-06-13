import { cache } from "react";
import { put, list, del } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  AppState,
  ItemBundle,
  MetaDoc,
  emptyMeta,
  emptyState,
} from "./types";
import { encrypt, decrypt } from "./crypto";
import { injectBaselines } from "./analytics";

// Sharded datastore. Each connection (Item) lives in its own document and the
// global meta (manual entries, net-worth snapshots) in another. This means a
// write for one bank never reads-or-overwrites another bank's data, which
// eliminates the lost-update race that a single shared document suffers under
// rapid successive connects/syncs.
//
// Backends: Vercel Blob in production, or a local .data/ directory in dev (no
// blob token). Every document is AES-256-GCM encrypted at rest.
//
// Document "names" are backend-agnostic keys; item bundles are "item__<id>",
// global meta is "meta".

const PREFIX = "moneytracker/v2/";
const LOCAL_DIR = path.join(process.cwd(), ".data", "v2");

function blobEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
function canEncrypt(): boolean {
  return !!process.env.ENCRYPTION_KEY;
}
function blobPath(name: string): string {
  return `${PREFIX}${name}.enc`;
}
function localPath(name: string): string {
  return path.join(LOCAL_DIR, `${name}.enc`);
}
// Plaintext is only acceptable for the local .data/ dev backend. Blob documents
// live at predictable public URLs, so refusing to operate without a key beats
// silently writing readable financial data.
function requireKeyForBlob(): void {
  if (blobEnabled() && !canEncrypt()) {
    throw new Error(
      "ENCRYPTION_KEY must be set when storing data in Vercel Blob — refusing to read/write financial data unencrypted. Generate with: openssl rand -hex 32",
    );
  }
}
function encode(obj: unknown): string {
  requireKeyForBlob();
  const json = JSON.stringify(obj);
  return canEncrypt() ? encrypt(json) : json;
}
function decode<T>(raw: string): T {
  requireKeyForBlob();
  const json = canEncrypt() ? decrypt(raw) : raw;
  return JSON.parse(json) as T;
}

// ── low-level document IO ───────────────────────────────────────────────────

async function writeDoc(name: string, obj: unknown): Promise<void> {
  const body = encode(obj);
  if (blobEnabled()) {
    await put(blobPath(name), body, {
      access: "public",
      contentType: "application/octet-stream",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
  } else {
    await fs.mkdir(LOCAL_DIR, { recursive: true });
    await fs.writeFile(localPath(name), body, "utf8");
  }
}

async function readDoc<T>(name: string): Promise<T | null> {
  if (blobEnabled()) {
    const { blobs } = await list({ prefix: blobPath(name), limit: 1 });
    const match = blobs.find((b) => b.pathname === blobPath(name));
    if (!match) return null;
    // Cache-bust with uploadedAt so the CDN can't serve a stale copy after a write.
    const v = match.uploadedAt ? new Date(match.uploadedAt).getTime() : Date.now();
    const res = await fetch(`${match.url}?v=${v}`, { cache: "no-store" });
    if (!res.ok) return null;
    return decode<T>(await res.text());
  }
  try {
    return decode<T>(await fs.readFile(localPath(name), "utf8"));
  } catch {
    return null;
  }
}

async function delDoc(name: string): Promise<void> {
  if (blobEnabled()) {
    const { blobs } = await list({ prefix: blobPath(name), limit: 1 });
    const match = blobs.find((b) => b.pathname === blobPath(name));
    if (match) await del(match.url);
  } else {
    await fs.rm(localPath(name), { force: true });
  }
}

async function listNames(keyPrefix: string): Promise<string[]> {
  if (blobEnabled()) {
    const { blobs } = await list({ prefix: `${PREFIX}${keyPrefix}` });
    return blobs
      .map((b) => b.pathname.slice(PREFIX.length, -".enc".length))
      .filter(Boolean);
  }
  try {
    const files = await fs.readdir(LOCAL_DIR);
    return files
      .filter((f) => f.startsWith(keyPrefix) && f.endsWith(".enc"))
      .map((f) => f.slice(0, -".enc".length));
  } catch {
    return [];
  }
}

// ── one-time v1 → v2 migration ──────────────────────────────────────────────
// The previous release kept the entire AppState in a single document
// ("moneytracker/state.enc" in Blob, ".data/state.enc" locally). When the v2
// store is empty but a v1 document exists, split it into per-item bundles plus
// meta so existing connections (and their encrypted Plaid access tokens),
// manual entries, and the net-worth snapshot history all survive the upgrade.
// The v1 document is left untouched as a backup. Writing meta marks the
// migration done, and concurrent runs are harmless (same input, same writes).

const V1_BLOB_PATH = "moneytracker/state.enc";
const V1_LOCAL_PATH = path.join(process.cwd(), ".data", "state.enc");

let migrationChecked = false;

async function readLegacyState(): Promise<AppState | null> {
  let raw: string | null = null;
  if (blobEnabled()) {
    const { blobs } = await list({ prefix: V1_BLOB_PATH, limit: 1 });
    const match = blobs.find((b) => b.pathname === V1_BLOB_PATH);
    if (!match) return null;
    const res = await fetch(`${match.url}?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    raw = await res.text();
  } else {
    try {
      raw = await fs.readFile(V1_LOCAL_PATH, "utf8");
    } catch {
      return null;
    }
  }
  try {
    return decode<AppState>(raw);
  } catch {
    return null;
  }
}

async function ensureMigrated(): Promise<void> {
  if (migrationChecked) return;
  const existing = await listNames("");
  if (existing.length > 0) {
    migrationChecked = true;
    return;
  }
  const legacy = await readLegacyState();
  if (legacy) {
    const byItem = new Map<string, ItemBundle>(
      (legacy.items ?? []).map((item) => [
        item.id,
        { item, accounts: [], transactions: [], recurring: [] },
      ]),
    );
    const acctToItem = new Map<string, string>();
    for (const a of legacy.accounts ?? []) {
      acctToItem.set(a.id, a.itemId);
      byItem.get(a.itemId)?.accounts.push(a);
    }
    for (const t of legacy.transactions ?? []) {
      const owner = acctToItem.get(t.accountId);
      if (owner) byItem.get(owner)?.transactions.push(t);
    }
    for (const r of legacy.recurring ?? []) {
      const owner = acctToItem.get(r.accountId);
      if (owner) byItem.get(owner)?.recurring.push(r);
    }
    for (const bundle of byItem.values()) {
      await writeDoc(itemKey(bundle.item.id), bundle);
    }
    const meta: MetaDoc = {
      version: legacy.version ?? 1,
      manualEntries: legacy.manualEntries ?? [],
      snapshots: legacy.snapshots ?? [],
    };
    await writeDoc("meta", meta);
  }
  migrationChecked = true;
}

// ── item bundles ────────────────────────────────────────────────────────────

function itemKey(itemId: string): string {
  return `item__${itemId}`;
}

export async function loadItemBundle(itemId: string): Promise<ItemBundle | null> {
  await ensureMigrated();
  return readDoc<ItemBundle>(itemKey(itemId));
}

export async function saveItemBundle(bundle: ItemBundle): Promise<void> {
  // Migrate before the first write too — a fresh v2 doc appearing first would
  // otherwise make the migration check think there's nothing to do and orphan
  // the legacy data.
  await ensureMigrated();
  await writeDoc(itemKey(bundle.item.id), bundle);
}

export async function deleteItemBundle(itemId: string): Promise<void> {
  await delDoc(itemKey(itemId));
}

export async function listItemIds(): Promise<string[]> {
  await ensureMigrated();
  const names = await listNames("item__");
  return names.map((n) => n.slice("item__".length));
}

// ── meta ────────────────────────────────────────────────────────────────────

export async function loadMeta(): Promise<MetaDoc> {
  await ensureMigrated();
  return (await readDoc<MetaDoc>("meta")) ?? emptyMeta();
}

export async function saveMeta(meta: MetaDoc): Promise<void> {
  await ensureMigrated();
  await writeDoc("meta", meta);
}

// ── assembled read model ────────────────────────────────────────────────────

/** Assemble the full AppState by merging every item bundle + meta. */
export async function loadState(): Promise<AppState> {
  const ids = await listItemIds();
  const bundles = (
    await Promise.all(ids.map((id) => loadItemBundle(id)))
  ).filter(Boolean) as ItemBundle[];

  const state = emptyState();
  for (const b of bundles) {
    state.items.push(b.item);
    state.accounts.push(...b.accounts);
    state.transactions.push(...b.transactions);
    state.recurring.push(...b.recurring);
  }
  state.transactions.sort((a, b) => b.date.localeCompare(a.date));

  const meta = await loadMeta();
  state.version = meta.version;
  state.manualEntries = meta.manualEntries;
  state.baselines = meta.baselines ?? [];
  state.snapshots = meta.snapshots;
  return injectBaselines(state);
}

/**
 * Request-deduped `loadState` for server components — the (app) layout and the
 * page it wraps share a single blob read per request. Sync paths must keep
 * using the uncached `loadState`: they read again after writing within one
 * request, and a cached read would hand back the pre-write state.
 */
export const loadStateCached = cache(loadState);

/** Find which item owns a given account id. */
export async function bundleForAccount(
  accountId: string,
): Promise<ItemBundle | null> {
  const ids = await listItemIds();
  for (const id of ids) {
    const b = await loadItemBundle(id);
    if (b && b.accounts.some((a) => a.id === accountId)) return b;
  }
  return null;
}
