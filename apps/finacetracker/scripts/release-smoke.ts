import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer } from "node:net";
import { encrypt, sha256Hex } from "../src/lib/crypto";
import { decodeBackup } from "../src/lib/backup";
import { emptyMeta, type ItemBundle } from "../src/lib/types";
import { CARD_CATALOG } from "../src/lib/cards";

/** This test starts its own server and only writes to a temporary local store. */
async function main() {
  const directory = await mkdtemp(path.join(tmpdir(), "finacetracker-http-"));
  const key = "44".repeat(32);
  process.env.ENCRYPTION_KEY = key;
  const bundle: ItemBundle = {
    item: { id: "fixture", provider: "csv", institutionName: "Fixture Bank", accessTokenEnc: "", cursor: null, status: "healthy", error: null, lastSyncedAt: null, createdAt: "2026-01-01" },
    accounts: [
      { id: "usd", itemId: "fixture", name: "USD fixture", officialName: null, mask: null, type: "depository", subtype: "checking", currency: "USD", balances: { current: 100, available: 100, limit: null }, source: "csv" },
      { id: "eur", itemId: "fixture", name: "EUR fixture", officialName: null, mask: null, type: "depository", subtype: "checking", currency: "EUR", balances: { current: 200, available: 200, limit: null }, source: "csv" },
      { id: "missing", itemId: "fixture", name: "Unavailable card", officialName: null, mask: null, type: "credit", subtype: "credit card", currency: "USD", balances: { current: null, available: null, limit: null }, lastReportedBalances: { current: 500, available: null, limit: null }, availability: "unavailable", source: "csv" },
    ],
    transactions: ["2026-08-01", "2026-10-01"].map((date, index) => ({ id: `entry${index}`, accountId: "usd", amount: 20, currency: "USD", date, name: "=1+1", merchantName: "Fixture merchant", pending: false, categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: null, paymentChannel: null, source: "csv", userCategory: null, note: "Fixture note", hidden: false })),
    recurring: [],
  };
  await writeFile(path.join(directory, "meta.enc"), encrypt(JSON.stringify(emptyMeta())));
  await writeFile(path.join(directory, "item__fixture.enc"), encrypt(JSON.stringify(bundle)));
  const listener = createServer(); listener.listen(0, "127.0.0.1"); await once(listener, "listening");
  const port = (listener.address() as { port: number }).port; await new Promise<void>((resolve) => listener.close(() => resolve()));
  const password = "isolated-fixture-password";
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: process.cwd(), env: { ...process.env, NODE_ENV: "production", LOCAL_DATA_DIR: directory, ENCRYPTION_KEY: key, SESSION_SECRET: "isolated-fixture-session-secret-at-least-32-characters", APP_PASSWORD_HASH: sha256Hex(password), BLOB_READ_WRITE_TOKEN: "", PLAID_CLIENT_ID: "", PLAID_SECRET: "", APP_BASE_URL: "", APP_TIMEZONE: "America/Los_Angeles" }, stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  server.stdout.on("data", (chunk) => { output = (output + chunk.toString()).slice(-8000); });
  server.stderr.on("data", (chunk) => { output = (output + chunk.toString()).slice(-8000); });
  const base = `http://127.0.0.1:${port}`;
  let cookie = "";
  const request = (url: string, body?: unknown, extraCookie = "") => fetch(base + url, { redirect: "manual", headers: { Cookie: [cookie, extraCookie].filter(Boolean).join("; "), ...(body === undefined ? {} : { "Content-Type": "application/json" }) }, ...(body === undefined ? {} : { method: "POST", body: JSON.stringify(body) }) });
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error(`Fixture server exited: ${output}`);
      try { if ((await fetch(base + "/login")).ok) break; } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    for (const route of ["/api/backup", "/api/details?metric=networth", "/api/export/csv"]) assert.equal((await request(route)).status, 401);
    assert.equal((await request("/api/auth/login", { password: "wrong" })).status, 401);
    const login = await request("/api/auth/login", { password }); assert.equal(login.status, 200);
    cookie = login.headers.getSetCookie().map((v) => v.split(";")[0]).join("; ");
    assert.match(cookie, /^finacetracker_session=/);
    for (const route of ["/", "/accounts", "/spending", "/income", "/analysis", "/transactions", "/recurring", "/cards", "/settings"]) {
      const response = await request(route); assert.equal(response.status, 200, route);
      const html = await response.text(); assert.match(html, /finacetracker/); assert.doesNotMatch(html, /Vault — Money Tracker/);
    }
    const focused = await (await request("/", undefined, "finacetracker_account=missing")).text();
    assert.match(focused, /Balance unavailable/);
    const eur = await (await request("/api/details?metric=networth&currency=EUR")).json();
    assert.equal(eur.summary.find((s: { label: string }) => s.label === "Net worth").value, 200);
    const usd = await (await request("/api/details?metric=networth&currency=USD")).json();
    assert.match(usd.notes.join(" "), /Missing does not mean zero/);
    const csv = await (await request("/api/export/csv")).text(); assert.match(csv, /'\=1\+1/);
    const backup = await (await request("/api/backup")).text(); const decoded = decodeBackup(backup);
    assert.equal(decoded.bundles[0].transactions.length, 2);
    const preview = await (await request("/api/backup", { action: "preview", backup })).json();
    assert.equal(preview.conflictCount, 0);
    assert.equal((await request("/api/backup", { action: "restore", backup, fingerprint: preview.fingerprint })).status, 200);
    const oldPreview = await (await request("/api/backup", { action: "preview", backup })).json();
    const entry = { name: "Fixture cash", value: 25, kind: "asset", currency: "EUR", requestId: "repeatable-fixture-id" };
    assert.equal((await request("/api/manual", entry)).status, 200); assert.equal((await request("/api/manual", entry)).status, 200);
    assert.equal((await request("/api/backup", { action: "restore", backup, fingerprint: oldPreview.fingerprint })).status, 409);
    const card = CARD_CATALOG.find((c) => c.credits.length)!; const credit = card.credits[0].name;
    const patch = await fetch(base + "/api/cards/overrides", { method: "PATCH", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify({ cardKey: card.cardKey, creditName: credit, slotKey: "2026-10", value: false }) });
    assert.equal(patch.status, 200);
    const migrated = await (await request("/api/cards/overrides", { overrides: { [card.cardKey]: { [credit]: { "2026-10": true, "2026-09": true } } } })).json();
    assert.equal(migrated.overrides[card.cardKey][credit]["2026-10"], false);
    const secondLogin = await request("/api/auth/login", { password }); cookie = secondLogin.headers.getSetCookie().map((v) => v.split(";")[0]).join("; ");
    const after = decodeBackup(await (await request("/api/backup")).text());
    assert.equal(after.meta.manualEntries.length, 1); assert.equal(after.meta.manualEntries[0].currency, "EUR");
    assert.equal(after.meta.cardOverrides?.[card.cardKey][credit]["2026-10"], false);
    assert.equal((await request("/api/backup", { action: "preview", backup: "bad" })).status, 400);
    console.log("Release smoke passed: 9 pages; auth; native currencies; unknown balances; formula-safe CSV; encrypted backup; additive restore; stale-preview rejection; idempotent manual entry; cross-session credit corrections.");
  } catch (error) {
    console.error(output); throw error;
  } finally {
    if (server.exitCode === null) { server.kill("SIGTERM"); await once(server, "exit"); }
    await rm(directory, { recursive: true, force: true });
  }
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
