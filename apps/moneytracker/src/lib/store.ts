import { cache } from "react";
import { put, list, del, BlobPreconditionFailedError, type ListBlobResultBlob } from "@vercel/blob";
import { promises as fs } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { hostname } from "node:os";
import path from "node:path";
import {
  AppState,
  ItemBundle,
  MetaDoc,
  emptyMeta,
  emptyState,
} from "./types";
import { encrypt, decrypt } from "./crypto";
import { injectBaselines, normalizeAccountTransactions } from "./analytics";

// Each connection and global metadata use separate documents. Conditional
// writes reject stale versions, including writes from other server instances.
//
// Backends: Vercel Blob in production, or a local .data/ directory in dev (no
// blob token). Every document is AES-256-GCM encrypted at rest.
//
// Document "names" are backend-agnostic keys; item bundles are "item__<id>",
// global meta is "meta".

const PREFIX = "moneytracker/v2/";
const LOCAL_DIR = path.join(process.cwd(), ".data", "v2");
const REVISION = Symbol("storageRevision");
type Revision = { name: string; etag: string | null };
type Versioned = { [REVISION]?: Revision };
type CachedDocument = { pathname: string; etag: string; raw: string; bytes: number };
const DASHBOARD_CACHE_ENTRIES = 16;
const DASHBOARD_CACHE_BYTES = 16 * 1024 * 1024;
const dashboardDocuments = new Map<string, CachedDocument>();
let dashboardCacheBytes = 0;
let dashboardCacheGeneration = 0;

function forgetDashboardDocument(url: string): void {
  const previous = dashboardDocuments.get(url);
  if (previous) dashboardCacheBytes -= previous.bytes;
  dashboardDocuments.delete(url);
}

function invalidateDashboardDocument(name: string): void {
  // An earlier body read must not refill the cache after a mutation.
  dashboardCacheGeneration++;
  for (const [url, document] of dashboardDocuments) {
    if (document.pathname === blobPath(name)) forgetDashboardDocument(url);
  }
}

function rememberDashboardDocument(blob: ListBlobResultBlob, etag: string, raw: string): void {
  forgetDashboardDocument(blob.url);
  // Never store a stale CDN body under a newer listing revision.
  const bytes = raw.length * 2;
  if (etag !== blob.etag || bytes > DASHBOARD_CACHE_BYTES) return;
  while (dashboardDocuments.size >= DASHBOARD_CACHE_ENTRIES || dashboardCacheBytes + bytes > DASHBOARD_CACHE_BYTES) {
    forgetDashboardDocument(dashboardDocuments.keys().next().value!);
  }
  dashboardDocuments.set(blob.url, { pathname: blob.pathname, etag, raw, bytes });
  dashboardCacheBytes += bytes;
}

export class StorageConflictError extends Error {
  constructor() {
    super("Data changed during this request. Reload and try again.");
    this.name = "StorageConflictError";
  }
}

export class InstitutionReservationError extends StorageConflictError {
  constructor() {
    super();
    this.name = "InstitutionReservationError";
    this.message = "This institution is already connected or a connection is in progress.";
  }
}

export interface InstitutionReservation {
  institutionId: string;
  itemId: string;
}

function withRevision<T extends object>(obj: T, name: string, etag: string | null): T {
  // Spread copies this symbol; JSON serialization omits it.
  Object.defineProperty(obj, REVISION, {
    value: { name, etag }, enumerable: true, writable: true, configurable: true,
  });
  return obj;
}

function revisionOf(obj: object, name: string): string | null {
  const revision = (obj as Versioned)[REVISION];
  if (revision && revision.name !== name) throw new StorageConflictError();
  return revision?.etag ?? null;
}

function localRevision(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

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
function encode(obj: object): string {
  requireKeyForBlob();
  // A unique revision also prevents delete/recreate ABA races in plaintext dev storage.
  // Keep domain fields at the root so an older deployment can still read them.
  const json = JSON.stringify({ ...obj, __vaultRevision: randomUUID() });
  return canEncrypt() ? encrypt(json) : json;
}
function decode<T>(raw: string): T {
  requireKeyForBlob();
  const json = canEncrypt() ? decrypt(raw) : raw;
  const parsed = JSON.parse(json);
  if (parsed && typeof parsed.__vaultRevision === "string") {
    if ("document" in parsed) return parsed.document as T;
    delete parsed.__vaultRevision;
  }
  return parsed as T;
}

// ── low-level document IO ───────────────────────────────────────────────────

async function readLocal(name: string): Promise<string | null> {
  try {
    return await fs.readFile(localPath(name), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function withLocalLock<T>(name: string, action: () => Promise<T>): Promise<T> {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  const lockPath = `${localPath(name)}.lock`;
  let lock;
  try {
    lock = await fs.open(lockPath, "wx", 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    // One reclaimer at a time; another reclaimer must not unlink a new owner.
    const recoveryPath = `${lockPath}.recover`;
    let recovery;
    try {
      recovery = await fs.open(recoveryPath, "wx", 0o600);
    } catch {
      throw new StorageConflictError();
    }
    try {
      const owner = JSON.parse(await fs.readFile(lockPath, "utf8")) as { pid: number; host: string };
      if (owner.host !== hostname() || !Number.isInteger(owner.pid) || owner.pid <= 0) {
        throw new StorageConflictError();
      }
      let dead = false;
      try { process.kill(owner.pid, 0); } catch (failure) {
        dead = (failure as NodeJS.ErrnoException).code === "ESRCH";
      }
      if (!dead) throw new StorageConflictError();
      await fs.rm(lockPath);
      lock = await fs.open(lockPath, "wx", 0o600);
    } catch {
      throw new StorageConflictError();
    } finally {
      await recovery.close();
      await fs.rm(recoveryPath, { force: true });
    }
  }
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, host: hostname() }));
    return await action();
  } finally {
    await lock.close();
    await fs.rm(lockPath, { force: true });
  }
}

async function writeDoc(name: string, obj: object, previous: object = obj): Promise<void> {
  const body = encode(obj);
  const expected = revisionOf(previous, name);
  let etag: string;
  if (blobEnabled()) {
    invalidateDashboardDocument(name);
    try {
      const result = await put(blobPath(name), body, {
        access: "public",
        contentType: "application/octet-stream",
        addRandomSuffix: false,
        allowOverwrite: expected !== null,
        ...(expected === null ? {} : { ifMatch: expected }),
        cacheControlMaxAge: 60,
      });
      etag = result.etag;
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) throw new StorageConflictError();
      // A create can race another create. Never retry it as an overwrite.
      if (expected === null && await readDoc(name)) throw new StorageConflictError();
      throw error;
    } finally {
      invalidateDashboardDocument(name);
    }
  } else {
    etag = await withLocalLock(name, async () => {
      const current = await readLocal(name);
      if ((current === null ? null : localRevision(current)) !== expected) {
        throw new StorageConflictError();
      }
      const temporary = `${localPath(name)}.${randomUUID()}.tmp`;
      try {
        await fs.writeFile(temporary, body, { encoding: "utf8", mode: 0o600 });
        await fs.rename(temporary, localPath(name));
      } finally {
        await fs.rm(temporary, { force: true });
      }
      return localRevision(body);
    });
  }
  withRevision(obj, name, etag);
}

async function readBlobDocument<T extends object>(
  name: string,
  blob: ListBlobResultBlob,
  useDashboardCache = false,
): Promise<T> {
  const generation = dashboardCacheGeneration;
  if (useDashboardCache) {
    const cached = dashboardDocuments.get(blob.url);
    if (cached && blob.etag && cached.etag === blob.etag) {
      dashboardDocuments.delete(blob.url);
      dashboardDocuments.set(blob.url, cached);
      // Keep decoded objects private to each request.
      return withRevision(decode<T>(cached.raw), name, cached.etag);
    }
    forgetDashboardDocument(blob.url);
  }
  const res = await fetch(`${blob.url}?v=${randomUUID()}`, {
    cache: "no-store",
    // Compressed responses use weak ETags, which conditional writes reject.
    headers: { "Accept-Encoding": "identity" },
  });
  if (!res.ok) throw new Error(`Storage read failed (${res.status})`);
  // The revision must come from the same response as the document body.
  const etag = res.headers.get("etag");
  if (!etag) throw new Error("Storage read failed: missing document revision");
  const raw = await res.text();
  const document = withRevision(decode<T>(raw), name, etag);
  if (useDashboardCache && generation === dashboardCacheGeneration) rememberDashboardDocument(blob, etag, raw);
  return document;
}

async function readDoc<T extends object>(name: string): Promise<T | null> {
  if (blobEnabled()) {
    const { blobs } = await list({ prefix: blobPath(name), limit: 1 });
    const match = blobs.find((b) => b.pathname === blobPath(name));
    return match ? readBlobDocument<T>(name, match) : null;
  }
  const raw = await readLocal(name);
  return raw === null ? null : withRevision(decode<T>(raw), name, localRevision(raw));
}

async function delDoc(name: string, previous: object): Promise<void> {
  const expected = revisionOf(previous, name);
  if (expected === null) throw new StorageConflictError();
  if (blobEnabled()) {
    invalidateDashboardDocument(name);
    try {
      await del(blobPath(name), { ifMatch: expected });
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) throw new StorageConflictError();
      throw error;
    } finally {
      invalidateDashboardDocument(name);
    }
  } else {
    await withLocalLock(name, async () => {
      const current = await readLocal(name);
      if (current === null || localRevision(current) !== expected) throw new StorageConflictError();
      await fs.rm(localPath(name));
    });
  }
}

async function listBlobs(keyPrefix: string): Promise<ListBlobResultBlob[]> {
  const blobs: ListBlobResultBlob[] = [];
  const cursors = new Set<string>();
  let cursor: string | undefined;
  do {
    const result = await list({ prefix: `${PREFIX}${keyPrefix}`, cursor });
    blobs.push(...result.blobs);
    if (!result.hasMore) break;
    if (!result.cursor || cursors.has(result.cursor)) throw new Error("Storage listing failed: invalid pagination");
    cursor = result.cursor;
    cursors.add(cursor);
  } while (cursor);
  return blobs;
}

async function listNames(keyPrefix: string): Promise<string[]> {
  if (blobEnabled()) {
    return (await listBlobs(keyPrefix))
      .filter((b) => b.pathname.endsWith(".enc"))
      .map((b) => b.pathname.slice(PREFIX.length, -".enc".length))
      .filter(Boolean);
  }
  try {
    const files = await fs.readdir(LOCAL_DIR);
    return files
      .filter((f) => f.startsWith(keyPrefix) && f.endsWith(".enc"))
      .map((f) => f.slice(0, -".enc".length));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

// ── one-time v1 → v2 migration ──────────────────────────────────────────────
// The previous release kept the entire AppState in a single document
// ("moneytracker/state.enc" in Blob, ".data/state.enc" locally). When the v2
// store is empty but a v1 document exists, split it into per-item bundles plus
// meta so existing connections (and their encrypted Plaid access tokens),
// manual entries, and the net-worth snapshot history all survive the upgrade.
// The v1 document stays untouched. Meta marks completion. Create-only writes
// let interrupted migrations resume without replacing newer item documents.

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
    if (!res.ok) throw new Error(`Storage read failed (${res.status})`);
    raw = await res.text();
  } else {
    try {
      raw = await fs.readFile(V1_LOCAL_PATH, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  return decode<AppState>(raw);
}

async function ensureMigrated(): Promise<void> {
  if (migrationChecked) return;
  if (await readDoc<MetaDoc>("meta")) {
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
      const name = itemKey(bundle.item.id);
      if (await readDoc(name)) continue;
      try {
        await writeDoc(name, bundle);
      } catch (error) {
        if (!(error instanceof StorageConflictError) || !await readDoc(name)) throw error;
      }
    }
    const meta: MetaDoc = {
      version: legacy.version ?? 1,
      manualEntries: legacy.manualEntries ?? [],
      baselines: legacy.baselines ?? [],
      snapshots: legacy.snapshots ?? [],
      biltConfig: legacy.biltConfig,
      employerHousingSupport: legacy.employerHousingSupport,
      cardStatuses: legacy.cardStatuses,
    };
    try {
      await writeDoc("meta", meta);
    } catch (error) {
      if (!(error instanceof StorageConflictError) || !await readDoc("meta")) throw error;
    }
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

export async function saveItemBundle(
  bundle: ItemBundle,
  previous: ItemBundle = bundle,
): Promise<void> {
  // Complete migration before accepting changes to a connection.
  await ensureMigrated();
  await writeDoc(itemKey(bundle.item.id), bundle, previous);
}

export async function deleteItemBundle(
  itemId: string,
  previous?: ItemBundle,
): Promise<{ warning?: string }> {
  const bundle = previous ?? await loadItemBundle(itemId);
  if (!bundle) return {};
  await delDoc(itemKey(itemId), bundle);
  if (bundle.item.institutionId) {
    try {
      const claim = await readDoc<InstitutionReservation>(institutionKey(bundle.item.institutionId));
      if (claim?.itemId === itemId) await releaseInstitution(claim);
    } catch {
      return { warning: "Connection removed. Its institution lock could not be released. Reconnect requires lock cleanup." };
    }
  }
  return {};
}

function institutionKey(institutionId: string): string {
  return `institution__${createHash("sha256").update(institutionId).digest("hex")}`;
}

/** Reserve a bank before creating its item. A claim has no unsafe time expiry. */
export async function reserveInstitution(
  institutionId: string,
  itemId: string,
): Promise<InstitutionReservation> {
  await ensureMigrated();
  const claim = { institutionId, itemId };
  try {
    await writeDoc(institutionKey(institutionId), claim);
  } catch (error) {
    if (error instanceof StorageConflictError) throw new InstitutionReservationError();
    throw error;
  }
  return claim;
}

/** Release only the exact claim created by this request. */
export async function releaseInstitution(claim: InstitutionReservation): Promise<void> {
  await delDoc(institutionKey(claim.institutionId), claim);
}

export async function listItemIds(): Promise<string[]> {
  await ensureMigrated();
  const names = await listNames("item__");
  return names.map((n) => n.slice("item__".length));
}

// ── meta ────────────────────────────────────────────────────────────────────

export async function loadMeta(): Promise<MetaDoc> {
  await ensureMigrated();
  return (await readDoc<MetaDoc>("meta")) ?? withRevision(emptyMeta(), "meta", null);
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
  return assembleState(bundles, await loadMeta());
}

function assembleState(bundles: ItemBundle[], meta: MetaDoc): AppState {
  const state = emptyState();
  for (const b of bundles) {
    state.items.push(b.item);
    state.accounts.push(...b.accounts);
    state.transactions.push(...b.transactions);
    state.recurring.push(...b.recurring);
  }
  state.transactions.sort((a, b) => b.date.localeCompare(a.date));

  state.version = meta.version;
  state.manualEntries = meta.manualEntries;
  state.baselines = meta.baselines ?? [];
  state.snapshots = meta.snapshots;
  state.biltConfig = meta.biltConfig;
  state.employerHousingSupport = meta.employerHousingSupport ?? null;
  state.cardStatuses = meta.cardStatuses;
  return injectBaselines(normalizeAccountTransactions(state));
}

async function loadDashboardState(): Promise<AppState> {
  if (!blobEnabled()) return loadState();
  const blobs = await listBlobs("");
  const metaBlob = blobs.find((blob) => blob.pathname === blobPath("meta"));
  if (!migrationChecked && !metaBlob) {
    await ensureMigrated();
    // Migration can create documents absent from the first listing.
    return loadDashboardState();
  }
  const itemBlobs = blobs.filter((blob) => blob.pathname.startsWith(`${PREFIX}item__`) && blob.pathname.endsWith(".enc"));
  const [meta, bundles] = await Promise.all([
    metaBlob ? readBlobDocument<MetaDoc>("meta", metaBlob, true) : emptyMeta(),
    Promise.all(itemBlobs.map((blob) => readBlobDocument<ItemBundle>(
      blob.pathname.slice(PREFIX.length, -4), blob, true,
    ))),
  ]);
  migrationChecked = true;
  return assembleState(bundles, meta);
}

/**
 * Server components share one fresh listing per request. Unchanged encrypted
 * documents reuse bounded process memory only after matching the listing ETag.
 * API and sync paths use loadState and always fetch document bodies again.
 */
export const loadStateCached = cache(loadDashboardState);

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
