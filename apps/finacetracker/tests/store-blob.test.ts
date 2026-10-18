import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { brotliCompressSync } from "node:zlib";
import type { AddressInfo } from "node:net";
import { emptyMeta, type ItemBundle } from "../src/lib/types";
import { encrypt, decrypt } from "../src/lib/crypto";

test("Blob rejects stale writes and deletes with the body ETag", async () => {
  const keys = ["BLOB_READ_WRITE_TOKEN", "VERCEL_BLOB_API_URL", "ENCRYPTION_KEY"] as const;
  const previousEnv = new Map(keys.map((key) => [key, process.env[key]]));
  process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_teststore_testtoken";
  process.env.ENCRYPTION_KEY = "12".repeat(32);
  const documents = new Map<string, { body: string; etag: string }>();
  const writes: { expected: string | undefined; overwrite: string | undefined }[] = [];
  const representations: string[] = [];
  let version = 1;
  let origin = "";
  const server = createServer(async (req, res) => {
    const url = new URL(req.url!, origin);
    const json = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    const metadata = (pathname: string, etag: string) => ({
      pathname, etag, url: `${origin}/objects/${pathname}`,
      downloadUrl: `${origin}/objects/${pathname}`, uploadedAt: "2026-01-01T00:00:00Z",
      size: 100, contentType: "application/octet-stream", contentDisposition: "attachment",
    });
    if (url.pathname.startsWith("/objects/")) {
      const document = documents.get(url.pathname.slice("/objects/".length));
      if (!document) { res.writeHead(404).end(); return; }
      const encoding = req.headers["accept-encoding"];
      representations.push(String(encoding));
      if (encoding === "identity") {
        res.writeHead(200, { etag: document.etag });
        res.end(document.body);
      } else {
        res.writeHead(200, { etag: `W/${document.etag}`, "content-encoding": "br" });
        res.end(brotliCompressSync(document.body));
      }
      return;
    }
    if (req.method === "GET") {
      const prefix = url.searchParams.get("prefix") ?? "";
      json(200, { hasMore: false, blobs: [...documents.keys()]
        .filter((pathname) => pathname.startsWith(prefix))
        // Listing metadata can lag the document response.
        .map((pathname) => metadata(pathname, '"stale-list-etag"')) });
      return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString();
    const pathname = req.method === "POST"
      ? (JSON.parse(body).urls as string[])[0]
      : url.searchParams.get("pathname")!;
    const current = documents.get(pathname);
    const expected = req.headers["x-if-match"] as string | undefined;
    if (req.method === "POST") {
      if (!expected || current?.etag !== expected) {
        json(412, { error: { code: "precondition_failed" } });
        return;
      }
      documents.delete(pathname);
      json(200, {});
      return;
    }
    const overwrite = req.headers["x-allow-overwrite"] as string | undefined;
    writes.push({ expected, overwrite });
    if ((expected && expected !== current?.etag) || (current && overwrite !== "1")) {
      json(412, { error: { code: "precondition_failed" } });
      return;
    }
    const etag = `"version-${++version}"`;
    documents.set(pathname, { body, etag });
    json(200, metadata(pathname, etag));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.VERCEL_BLOB_API_URL = origin;
  const oldMeta = { ...emptyMeta(), baselines: [{ id: "rent", name: "Rent", amount: 2000,
    category: "RENT_AND_UTILITIES", startMonth: "2026-01" }] };
  documents.set("moneytracker/v2/meta.enc", { body: encrypt(JSON.stringify(oldMeta)), etag: '"version-1"' });
  const oldBundle: ItemBundle = {
    item: { id: "legacy", provider: "plaid", institutionName: "Existing", accessTokenEnc: encrypt("fixture-token"), cursor: "old-cursor",
      status: "healthy", error: null, lastSyncedAt: null, createdAt: "2025-01-01" },
    accounts: [], transactions: [], recurring: [],
  };
  documents.set("moneytracker/v2/item__legacy.enc", { body: encrypt(JSON.stringify(oldBundle)), etag: '"legacy-etag"' });
  try {
    const { loadMeta, saveMeta, loadItemBundle, saveItemBundle,
      deleteItemBundle, StorageConflictError } = await import("../src/lib/store");
    const compressed = await fetch(`${origin}/objects/moneytracker/v2/meta.enc`);
    assert.equal(compressed.headers.get("etag"), 'W/"version-1"');
    assert.equal(compressed.headers.get("content-encoding"), "br");
    assert.equal(await compressed.text(), documents.get("moneytracker/v2/meta.enc")!.body);
    representations.length = 0;
    const first = await loadMeta();
    const stale = await loadMeta();
    first.biltConfig = { statementDay: 12 };
    await saveMeta(first);
    assert.deepEqual(writes[0], { expected: '"version-1"', overwrite: "1" });
    assert.ok(representations.length > 0 && representations.every((encoding) => encoding === "identity"));
    stale.biltConfig = { statementDay: 24 };
    await assert.rejects(saveMeta(stale), StorageConflictError);
    assert.equal((await loadMeta()).biltConfig?.statementDay, 12);
    const legacyReader = JSON.parse(decrypt(documents.get("moneytracker/v2/meta.enc")!.body));
    assert.equal(legacyReader.biltConfig.statementDay, 12);
    assert.deepEqual(legacyReader.manualEntries, []);
    assert.equal(typeof legacyReader.__finacetrackerRevision, "string");
    assert.equal("__finacetrackerRevision" in await loadMeta(), false);
    assert.deepEqual((await loadMeta()).baselines, oldMeta.baselines);
    const migratedBundle = (await loadItemBundle("legacy"))!;
    assert.equal(decrypt(migratedBundle.item.accessTokenEnc), "fixture-token");
    migratedBundle.item.institutionName = "Updated";
    await saveItemBundle(migratedBundle);
    const oldBundleReader = JSON.parse(decrypt(documents.get("moneytracker/v2/item__legacy.enc")!.body));
    assert.equal(oldBundleReader.item.cursor, "old-cursor");
    assert.equal(decrypt(oldBundleReader.item.accessTokenEnc), "fixture-token");
    assert.deepEqual(oldBundleReader.transactions, []);

    const bundle: ItemBundle = {
      item: { id: "new", provider: "csv", institutionName: "Test", accessTokenEnc: "", cursor: null,
        status: "healthy", error: null, lastSyncedAt: null, createdAt: "2026-01-01" },
      accounts: [], transactions: [], recurring: [],
    };
    await saveItemBundle(bundle);
    assert.deepEqual(writes.at(-1), { expected: undefined, overwrite: "0" });
    const old = (await loadItemBundle("new"))!;
    bundle.item.institutionName = "Changed";
    await saveItemBundle(bundle);
    await assert.rejects(deleteItemBundle("new", old), StorageConflictError);
    await deleteItemBundle("new", bundle);
    await assert.rejects(saveItemBundle(bundle), StorageConflictError);
    assert.equal(await loadItemBundle("new"), null);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    for (const [key, value] of previousEnv) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
