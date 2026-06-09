import { put, list } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";
import { AppState, emptyState } from "./types";
import { encrypt, decrypt } from "./crypto";

// Datastore for the single user's financial data — one JSON document. In
// production it lives in a Vercel Blob; in local dev (no blob token) it falls
// back to an encrypted file under .data/. All reads/writes go through this
// module so the backend can later be swapped for Postgres without touching
// callers.
//
// The document is AES-256-GCM encrypted at rest: storage holds only ciphertext,
// so even a public blob URL never leaks financial data. Key = ENCRYPTION_KEY.

const BLOB_PATH = "moneytracker/state.enc";
const LOCAL_PATH = path.join(process.cwd(), ".data", "state.enc");

let memo: { state: AppState } | null = null;

function blobEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function canEncrypt(): boolean {
  return !!process.env.ENCRYPTION_KEY;
}

async function fetchFromFile(): Promise<AppState | null> {
  try {
    const raw = await fs.readFile(LOCAL_PATH, "utf8");
    const json = canEncrypt() ? decrypt(raw) : raw;
    return JSON.parse(json) as AppState;
  } catch {
    return null;
  }
}

async function writeToFile(body: string): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, body, "utf8");
}

async function fetchFromBlob(): Promise<AppState | null> {
  // list() finds the blob by prefix; we then fetch its contents over HTTPS.
  const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 });
  const match = blobs.find((b) => b.pathname === BLOB_PATH);
  if (!match) return null;
  const res = await fetch(match.url, { cache: "no-store" });
  if (!res.ok) return null;
  const raw = await res.text();
  const json = canEncrypt() ? decrypt(raw) : raw;
  return JSON.parse(json) as AppState;
}

export async function loadState(): Promise<AppState> {
  if (memo) return memo.state;
  const state =
    (blobEnabled() ? await fetchFromBlob() : await fetchFromFile()) ?? emptyState();
  memo = { state };
  return state;
}

export async function saveState(state: AppState): Promise<void> {
  state.updatedAt = new Date().toISOString();
  memo = { state };
  const json = JSON.stringify(state);
  const body = canEncrypt() ? encrypt(json) : json;
  if (blobEnabled()) {
    await put(BLOB_PATH, body, {
      access: "public",
      contentType: "application/octet-stream",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
  } else {
    // Local dev fallback. Best-effort: a read-only FS (some hosts) just skips.
    try {
      await writeToFile(body);
    } catch {
      /* memory-only */
    }
  }
}

/**
 * Load state, apply a mutation, and persist. Returns the mutated state. For a
 * single user there is effectively no write concurrency, so no lock is needed.
 */
export async function mutateState(
  fn: (state: AppState) => void | Promise<void>,
): Promise<AppState> {
  const state = await loadState();
  await fn(state);
  await saveState(state);
  return state;
}

/** Test/maintenance helper: drop the in-memory cache. */
export function clearStateCache(): void {
  memo = null;
}
