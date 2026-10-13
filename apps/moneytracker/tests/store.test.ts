import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

test("local storage rejects corrupt records instead of returning empty state", async () => {
  const originalCwd = process.cwd();
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const directory = await mkdtemp(path.join(tmpdir(), "vault-store-test-"));
  try {
    process.chdir(directory);
    delete process.env.BLOB_READ_WRITE_TOKEN;
    delete process.env.ENCRYPTION_KEY;
    const { loadMeta } = await import("../src/lib/store");
    assert.deepEqual((await loadMeta()).manualEntries, []);
    await mkdir(path.join(directory, ".data/v2"), { recursive: true });
    await writeFile(path.join(directory, ".data/v2/meta.enc"), "corrupt record");
    await assert.rejects(loadMeta(), SyntaxError);
  } finally {
    process.chdir(originalCwd);
    if (blobToken === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = blobToken;
    if (encryptionKey === undefined) delete process.env.ENCRYPTION_KEY;
    else process.env.ENCRYPTION_KEY = encryptionKey;
    await rm(directory, { recursive: true, force: true });
  }
});
