import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { encodeBackup, decodeBackup, planRestore, validateBackup, type BackupData } from "../src/lib/backup";
import { emptyMeta, type ItemBundle } from "../src/lib/types";
import { encrypt } from "../src/lib/crypto";
import { CARD_CATALOG } from "../src/lib/cards";
import { validateCardOverrides, mergeCardOverrides } from "../src/lib/card-overrides";

function fixture(): BackupData {
  const bundle: ItemBundle = {
    item: { id: "bank", provider: "plaid", institutionName: "Fixture Bank", institutionId: "institution", accessTokenEnc: encrypt("fixture-access-token"), cursor: "saved-cursor", status: "healthy", error: null, lastSyncedAt: null, createdAt: "2026-01-01" },
    accounts: [{ id: "eur", itemId: "bank", name: "EUR account", officialName: null, mask: null, type: "depository", subtype: "checking", currency: "EUR", balances: { current: 100, available: 90, limit: null }, source: "plaid" }],
    transactions: [{ id: "entry", accountId: "eur", amount: 10, currency: "EUR", date: "2026-10-01", name: "Fixture", merchantName: "Merchant", pending: true, categoryPrimary: "FOOD_AND_DRINK", categoryDetailed: "DINING", paymentChannel: "online", source: "plaid", userCategory: "OTHER", note: "Preserve this note", hidden: true }], recurring: [],
  };
  const card = CARD_CATALOG.find((c) => c.credits.length)!;
  return { bundles: [bundle], meta: { ...emptyMeta(), manualEntries: [{ id: "manual", name: "Fixture asset", kind: "asset", value: 900, asOf: "2026-10-01" }], baselines: [{ id: "rent", name: "Rent", amount: 1000, category: "RENT_AND_UTILITIES", startMonth: "2026-01" }], snapshots: [{ date: "2026-10-01", totalAssets: 1000, totalLiabilities: 0, netWorth: 1000 }], biltConfig: { statementDay: 23 }, cardStatuses: { "sapphire-reserve": "closed" }, cardOverrides: { [card.cardKey]: { [card.credits[0].name]: { "2026-10": false } } } } };
}

test("encrypted full backup restores annotations, identities, metadata, and credentials in isolated storage", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "finacetracker-backup-"));
  const old = { key: process.env.ENCRYPTION_KEY, blob: process.env.BLOB_READ_WRITE_TOKEN, local: process.env.LOCAL_DATA_DIR };
  process.env.ENCRYPTION_KEY = "22".repeat(32); delete process.env.BLOB_READ_WRITE_TOKEN; process.env.LOCAL_DATA_DIR = directory;
  try {
    const source = fixture();
    const encoded = encodeBackup(source);
    assert.doesNotMatch(encoded, /fixture-access-token|Preserve this note|EUR account/);
    const decoded = decodeBackup(encoded);
    assert.deepEqual(decoded.bundles, source.bundles); assert.deepEqual(decoded.meta, source.meta);
    const plan = planRestore({ bundles: [], meta: emptyMeta() }, decoded);
    assert.deepEqual(plan.conflicts, []); assert.equal(plan.newConnections, 1); assert.equal(plan.newTransactions, 1);
    const store = await import("../src/lib/store");
    await store.reserveRestoredInstitution("institution", "bank");
    await store.reserveRestoredInstitution("institution", "bank");
    await assert.rejects(store.reserveRestoredInstitution("institution", "different"), /already connected/);
    for (const bundle of plan.bundles) await store.saveItemBundle(bundle);
    await store.saveMeta({ ...await store.loadMeta(), ...plan.meta });
    const restored = await store.loadItemBundle("bank");
    assert.equal(restored?.transactions[0].hidden, true); assert.equal(restored?.transactions[0].pending, true);
    assert.equal(restored?.transactions[0].currency, "EUR"); assert.equal(restored?.transactions[0].note, "Preserve this note");
    assert.deepEqual(JSON.parse(JSON.stringify(await store.loadMeta())), source.meta);
    assert.doesNotMatch(await readFile(path.join(directory, "item__bank.enc"), "utf8"), /Preserve this note/);
    const retry = planRestore({ bundles: [restored!], meta: await store.loadMeta() }, decoded);
    assert.deepEqual(retry.conflicts, []); assert.equal(retry.newTransactions, 0); assert.equal(retry.newConnections, 0);
    restored!.transactions[0].note = "Newer correction";
    assert.match(planRestore({ bundles: [restored!], meta: source.meta }, decoded).conflicts.join(" "), /Changed transaction/);
    const bad = structuredClone(decoded); bad.bundles[0].transactions[0].accountId = "orphan";
    assert.throws(() => validateBackup(bad), /Invalid backup/);
    const duplicate = structuredClone(decoded); duplicate.bundles.push(structuredClone(duplicate.bundles[0]));
    assert.throws(() => validateBackup(duplicate), /Invalid backup/);
    process.env.ENCRYPTION_KEY = "33".repeat(32);
    assert.throws(() => decodeBackup(encoded), /different data key/);
    assert.throws(() => decodeBackup('{"format":"finacetracker-encrypted-backup","version":99}'), /invalid/);
  } finally {
    for (const [key, value] of Object.entries({ ENCRYPTION_KEY: old.key, BLOB_READ_WRITE_TOKEN: old.blob, LOCAL_DATA_DIR: old.local })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    await rm(directory, { recursive: true, force: true });
  }
});

test("browser credit migration preserves newer server corrections and rejects invalid values", () => {
  const card = CARD_CATALOG.find((c) => c.credits.length)!;
  const credit = card.credits[0].name;
  const incoming = validateCardOverrides({ [card.cardKey]: { [credit]: { "2026-10": true, "2026-09": true } } });
  const saved = { [card.cardKey]: { [credit]: { "2026-10": false } } };
  const merged = mergeCardOverrides(saved, incoming);
  assert.equal(merged[card.cardKey][credit]["2026-10"], false);
  assert.equal(merged[card.cardKey][credit]["2026-09"], true);
  assert.throws(() => validateCardOverrides({ [card.cardKey]: { [credit]: { "2026-13": true } } }), /Invalid/);
  assert.throws(() => validateCardOverrides({ [card.cardKey]: { [credit]: { "2026-10": "true" } } }), /Invalid/);
  assert.throws(() => validateCardOverrides(JSON.parse('{"__proto__":{"x":true}}')), /Unknown/);
});
