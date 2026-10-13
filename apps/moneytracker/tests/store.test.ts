import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir, hostname } from "node:os";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { emptyState, type ItemBundle } from "../src/lib/types";

function bundle(id: string): ItemBundle {
  return {
    item: { id, provider: "csv", institutionName: id, accessTokenEnc: "", cursor: null,
      status: "healthy", error: null, lastSyncedAt: null, createdAt: "2026-01-01" },
    accounts: [], transactions: [], recurring: [],
  };
}

test("local storage preserves data through migration and conflicting writes", async (t) => {
  const originalCwd = process.cwd();
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const directory = await mkdtemp(path.join(tmpdir(), "vault-store-test-"));
  try {
    process.chdir(directory);
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.ENCRYPTION_KEY;
    const storageDirectory = path.join(directory, ".data/v2");
    await mkdir(storageDirectory, { recursive: true });
    const legacy = emptyState();
    legacy.items = [bundle("existing").item, bundle("missing").item];
    legacy.baselines = [{ id: "rent", name: "Rent", amount: 2000,
      category: "RENT_AND_UTILITIES", startMonth: "2026-01" }];
    legacy.biltConfig = { statementDay: 17, housingOverride: 2000 };
    await writeFile(path.join(directory, ".data/state.enc"), JSON.stringify(legacy));
    const current = bundle("existing");
    current.item.institutionName = "Newer saved name";
    await writeFile(path.join(storageDirectory, "item__existing.enc"), JSON.stringify(current));

    const { loadMeta, saveMeta, loadItemBundle, saveItemBundle, reserveInstitution,
      releaseInstitution, deleteItemBundle, StorageConflictError,
      InstitutionReservationError } = await import("../src/lib/store");

    await t.test("resumes migration without replacing newer items or dropping rent settings", async () => {
      const meta = await loadMeta();
      assert.deepEqual(meta.baselines, legacy.baselines);
      assert.deepEqual(meta.biltConfig, legacy.biltConfig);
      assert.equal((await loadItemBundle("existing"))?.item.institutionName, "Newer saved name");
      assert.equal((await loadItemBundle("missing"))?.item.id, "missing");
    });

    await t.test("rejects stale metadata and preserves revisions through object spread", async () => {
      const first = await loadMeta();
      const stale = await loadMeta();
      const updated = { ...first, biltConfig: { statementDay: 20 } };
      await saveMeta(updated);
      stale.baselines = [];
      await assert.rejects(saveMeta(stale), StorageConflictError);
      updated.biltConfig.statementDay = 21;
      await saveMeta(updated);
      const stored = await loadMeta();
      assert.equal(stored.biltConfig?.statementDay, 21);
      assert.deepEqual(stored.baselines, legacy.baselines);
      assert.equal((await readFile(path.join(storageDirectory, "meta.enc"), "utf8")).includes("storageRevision"), false);
    });

    await t.test("constructed sync output requires the loaded version", async () => {
      const previous = (await loadItemBundle("existing"))!;
      const stale = (await loadItemBundle("existing"))!;
      const replacement = bundle("existing");
      replacement.item.institutionName = "Synced";
      await assert.rejects(saveItemBundle(replacement), StorageConflictError);
      await saveItemBundle(replacement, previous);
      await assert.rejects(saveItemBundle(bundle("existing"), stale), StorageConflictError);
      assert.equal((await loadItemBundle("existing"))?.item.institutionName, "Synced");
    });

    await t.test("concurrent creates produce one complete document", async () => {
      const results = await Promise.allSettled([
        saveItemBundle(bundle("concurrent")), saveItemBundle(bundle("concurrent")),
      ]);
      assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
      const rejected = results.find((result) => result.status === "rejected") as PromiseRejectedResult;
      assert.ok(rejected.reason instanceof StorageConflictError);
      assert.equal((await loadItemBundle("concurrent"))?.item.id, "concurrent");
    });

    await t.test("stale deletes fail and stale sync cannot recreate a removed connection", async () => {
      const stale = (await loadItemBundle("existing"))!;
      const latest = (await loadItemBundle("existing"))!;
      latest.item.institutionName = "Edited";
      await saveItemBundle(latest);
      await assert.rejects(deleteItemBundle("existing", stale), StorageConflictError);
      await deleteItemBundle("existing", latest);
      await assert.rejects(saveItemBundle(latest), StorageConflictError);
      assert.equal(await loadItemBundle("existing"), null);
    });

    await t.test("institution claims block duplicate connects and release on item deletion", async () => {
      const claim = await reserveInstitution("bank", "bank-item");
      await assert.rejects(reserveInstitution("bank", "duplicate-item"), InstitutionReservationError);
      await releaseInstitution(claim);
      const currentClaim = await reserveInstitution("bank", "bank-item");
      await assert.rejects(releaseInstitution(claim), StorageConflictError);
      const bank = bundle("bank-item");
      bank.item.institutionId = "bank";
      await saveItemBundle(bank);
      await deleteItemBundle("bank-item", bank);
      const replacement = await reserveInstitution("bank", "replacement-item");
      await assert.rejects(releaseInstitution(currentClaim), StorageConflictError);
      await releaseInstitution(replacement);
    });

    await t.test("recovers dead local owners and preserves live local owners", async () => {
      const meta = await loadMeta();
      const lockPath = path.join(storageDirectory, "meta.enc.lock");
      await writeFile(lockPath, JSON.stringify({ pid: process.pid, host: hostname() }));
      await assert.rejects(saveMeta(meta), StorageConflictError);
      assert.equal(JSON.parse(await readFile(lockPath, "utf8")).pid, process.pid);
      const exited = spawnSync(process.execPath, ["-e", ""]);
      assert.equal(exited.status, 0);
      await writeFile(lockPath, JSON.stringify({ pid: exited.pid, host: hostname() }));
      meta.biltConfig = { statementDay: 19 };
      await saveMeta(meta);
      assert.equal((await loadMeta()).biltConfig?.statementDay, 19);
    });

    await t.test("corrupt records fail instead of returning empty state", async () => {
      await writeFile(path.join(storageDirectory, "meta.enc"), "corrupt record");
      await assert.rejects(loadMeta(), SyntaxError);
    });
  } finally {
    process.chdir(originalCwd);
    if (blobToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = blobToken;
    if (encryptionKey === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = encryptionKey;
    await rm(directory, { recursive: true, force: true });
  }
});
