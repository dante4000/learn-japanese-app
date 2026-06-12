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
function encode(obj: unknown): string {
  const json = JSON.stringify(obj);
  return canEncrypt() ? encrypt(json) : json;
}
function decode<T>(raw: string): T {
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

// ── item bundles ────────────────────────────────────────────────────────────

function itemKey(itemId: string): string {
  return `item__${itemId}`;
}

export async function loadItemBundle(itemId: string): Promise<ItemBundle | null> {
  return readDoc<ItemBundle>(itemKey(itemId));
}

export async function saveItemBundle(bundle: ItemBundle): Promise<void> {
  await writeDoc(itemKey(bundle.item.id), bundle);
}

export async function deleteItemBundle(itemId: string): Promise<void> {
  await delDoc(itemKey(itemId));
}

export async function listItemIds(): Promise<string[]> {
  const names = await listNames("item__");
  return names.map((n) => n.slice("item__".length));
}

// ── meta ────────────────────────────────────────────────────────────────────

export async function loadMeta(): Promise<MetaDoc> {
  return (await readDoc<MetaDoc>("meta")) ?? emptyMeta();
}

export async function saveMeta(meta: MetaDoc): Promise<void> {
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
  state.snapshots = meta.snapshots;
  return state;
}

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
