import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { emptyMeta, emptyState, type ItemBundle } from "../src/lib/types";
import { encrypt } from "../src/lib/crypto";

function bundle(id: string, institutionName = id): ItemBundle {
  return {
    item: { id, provider: "csv", institutionName, accessTokenEnc: "", cursor: null,
      status: "healthy", error: null, lastSyncedAt: null, createdAt: "2026-01-01" },
    accounts: [], transactions: [], recurring: [],
  };
}

test("dashboard validates bounded encrypted cache without changing mutation reads", async (t) => {
  const keys = ["BLOB_READ_WRITE_TOKEN", "VERCEL_BLOB_API_URL", "ENCRYPTION_KEY"] as const;
  const previousEnv = new Map(keys.map((key) => [key, process.env[key]]));
  process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_dashboard_testtoken";
  process.env.ENCRYPTION_KEY = "34".repeat(32);
  type Document = { body: string; etag: string };
  const documents = new Map<string, Document>();
  const listedEtags = new Map<string, string>();
  const servedBodies = new Map<string, Document>();
  let heldBody: { pathname: string; started: () => void; released: Promise<void> } | null = null;
  let version = 0;
  let origin = "";
  let objectPrefix = "/objects/";
  let latency = 0;
  let pageSize = 1000;
  let invalidCursor = false;
  let listings = 0;
  const bodyReads: string[] = [];
  let activeBodies = 0;
  let maxActiveBodies = 0;
  const putFixture = (name: string, value: object) => {
    documents.set(`moneytracker/v2/${name}.enc`, {
      body: encrypt(JSON.stringify(value)), etag: `"fixture-${++version}"`,
    });
  };
  const resetCounts = () => { listings = 0; bodyReads.length = 0; maxActiveBodies = 0; };
  const server = createServer(async (req, res) => {
    const url = new URL(req.url!, origin);
    const json = (status: number, value: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(value));
    };
    const metadata = (pathname: string, document: Document) => ({
      pathname, etag: listedEtags.get(pathname) ?? document.etag,
      url: `${origin}${objectPrefix}${pathname}`, downloadUrl: `${origin}${objectPrefix}${pathname}`,
      uploadedAt: "2026-01-01T00:00:00Z", size: document.body.length,
      contentType: "application/octet-stream", contentDisposition: "attachment",
    });
    if (url.pathname.startsWith(objectPrefix)) {
      const pathname = url.pathname.slice(objectPrefix.length);
      bodyReads.push(pathname);
      activeBodies++;
      maxActiveBodies = Math.max(maxActiveBodies, activeBodies);
      const document = servedBodies.get(pathname) ?? documents.get(pathname);
      if (heldBody?.pathname === pathname) {
        const hold = heldBody;
        heldBody = null;
        hold.started();
        await hold.released;
      }
      if (latency) await delay(latency);
      activeBodies--;
      if (!document) { res.writeHead(404).end(); return; }
      if (pathname.startsWith("moneytracker/v2/")) assert.equal(req.headers["accept-encoding"], "identity");
      res.writeHead(200, { etag: document.etag });
      res.end(document.body);
      return;
    }
    if (req.method === "GET") {
      listings++;
      if (latency) await delay(latency);
      const prefix = url.searchParams.get("prefix") ?? "";
      const matching = [...documents].filter(([pathname]) => pathname.startsWith(prefix));
      const start = Number(url.searchParams.get("cursor") ?? 0);
      const end = start + Math.min(pageSize, Number(url.searchParams.get("limit") ?? 1000));
      json(200, { hasMore: end < matching.length || invalidCursor,
        cursor: invalidCursor ? undefined : String(end),
        blobs: matching.slice(start, end).map(([pathname, document]) => metadata(pathname, document)) });
      return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString();
    const pathname = req.method === "POST"
      ? (JSON.parse(body).urls as string[])[0] : url.searchParams.get("pathname")!;
    const current = documents.get(pathname);
    const expected = req.headers["x-if-match"];
    if ((expected && current?.etag !== expected) || (current && !expected)) {
      json(412, { error: { code: "precondition_failed" } });
      return;
    }
    if (req.method === "POST") {
      documents.delete(pathname);
      json(200, {});
      return;
    }
    const document = { body, etag: `"write-${++version}"` };
    documents.set(pathname, document);
    json(200, metadata(pathname, document));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.VERCEL_BLOB_API_URL = origin;
  const legacy = emptyState();
  legacy.items = ["a", "b", "c"].map((id) => bundle(id, `Legacy ${id}`).item);
  legacy.biltConfig = { statementDay: 12 };
  legacy.employerHousingSupport = { source: "Employer", amount: 1200, startMonth: "2026-01" };
  documents.set("moneytracker/state.enc", { body: encrypt(JSON.stringify(legacy)), etag: '"legacy"' });
  putFixture("item__a", bundle("a"));
  try {
    const { loadState, loadStateCached, loadItemBundle, saveItemBundle,
      deleteItemBundle } = await import("../src/lib/store");

    await t.test("dashboard migration resumes existing items and reloads created metadata", async () => {
      const legacyBody = documents.get("moneytracker/state.enc")!.body;
      const state = await loadStateCached();
      assert.equal(state.items.length, 3);
      assert.equal(state.items.find((item) => item.id === "a")?.institutionName, "a");
      assert.equal(state.items.find((item) => item.id === "b")?.institutionName, "Legacy b");
      assert.deepEqual(state.biltConfig, legacy.biltConfig);
      assert.deepEqual(state.employerHousingSupport, legacy.employerHousingSupport);
      assert.equal(documents.get("moneytracker/state.enc")!.body, legacyBody);
      documents.clear();
      putFixture("meta", { ...emptyMeta(), biltConfig: { statementDay: 12 } });
      for (const id of ["a", "b", "c"]) putFixture(`item__${id}`, bundle(id));
      objectPrefix = "/benchmark/";
    });

    await t.test("one listing and parallel bodies replace repeated and serial reads", async () => {
      latency = 25;
      resetCounts();
      let start = performance.now();
      const cold = await loadStateCached();
      const coldMs = performance.now() - start;
      assert.equal(cold.items.length, 3);
      assert.equal(listings, 1);
      assert.equal(bodyReads.length, 4);
      assert.equal(maxActiveBodies, 4);

      resetCounts();
      start = performance.now();
      const warm = await loadStateCached();
      const warmMs = performance.now() - start;
      assert.deepEqual(warm, cold);
      assert.equal(listings, 1);
      assert.equal(bodyReads.length, 0);

      resetCounts();
      start = performance.now();
      assert.deepEqual(await loadState(), cold);
      const uncachedMs = performance.now() - start;
      assert.equal(listings, 5);
      assert.equal(bodyReads.length, 4);
      t.diagnostic(`Synthetic local HTTP, 25 ms per request, 3 items + metadata: unchanged API path ${uncachedMs.toFixed(1)} ms / 9 requests; dashboard cold ${coldMs.toFixed(1)} ms / 5 requests; dashboard warm ${warmMs.toFixed(1)} ms / 1 request.`);
      latency = 0;
    });

    await t.test("warm reads decode independent objects and enforce the encryption key", async () => {
      const first = await loadStateCached();
      first.items[0].institutionName = "Local mutation";
      first.biltConfig!.statementDay = 27;
      first.items.pop();
      const second = await loadStateCached();
      assert.equal(second.items.length, 3);
      assert.equal(second.items[0].institutionName, "a");
      assert.equal(second.biltConfig?.statementDay, 12);
      process.env.ENCRYPTION_KEY = "56".repeat(32);
      await assert.rejects(loadStateCached());
      process.env.ENCRYPTION_KEY = "34".repeat(32);
    });

    await t.test("fresh listings invalidate changed documents and omit deleted items", async () => {
      putFixture("item__b", bundle("b", "External update"));
      documents.delete("moneytracker/v2/item__c.enc");
      resetCounts();
      const state = await loadStateCached();
      assert.deepEqual(state.items.map((item) => item.id), ["a", "b"]);
      assert.equal(state.items[1].institutionName, "External update");
      assert.equal(listings, 1);
      assert.deepEqual(bodyReads, ["moneytracker/v2/item__b.enc"]);
    });

    await t.test("local writes invalidate cached bodies even if the listing lags", async () => {
      const pathname = "moneytracker/v2/item__a.enc";
      const previousEtag = documents.get(pathname)!.etag;
      const current = (await loadItemBundle("a"))!;
      current.item.institutionName = "Saved update";
      await saveItemBundle(current);
      listedEtags.set(pathname, previousEtag);
      resetCounts();
      assert.equal((await loadStateCached()).items[0].institutionName, "Saved update");
      assert.deepEqual(bodyReads, [pathname]);
      listedEtags.delete(pathname);
      await loadStateCached();
      await deleteItemBundle("a", current);
      assert.equal((await loadStateCached()).items.some((item) => item.id === "a"), false);
    });

    await t.test("a stale response never poisons the cache under a newer listing ETag", async () => {
      const pathname = "moneytracker/v2/item__b.enc";
      const previous = documents.get(pathname)!;
      putFixture("item__b", bundle("b", "New origin body"));
      servedBodies.set(pathname, previous);
      assert.equal((await loadStateCached()).items[0].institutionName, "External update");
      servedBodies.delete(pathname);
      resetCounts();
      assert.equal((await loadStateCached()).items[0].institutionName, "New origin body");
      assert.deepEqual(bodyReads, [pathname]);
    });

    await t.test("a body read started before a write cannot refill its invalidated cache", async () => {
      const pathname = "moneytracker/v2/item__b.enc";
      putFixture("item__b", bundle("b", "Before concurrent write"));
      const previousEtag = documents.get(pathname)!.etag;
      let started!: () => void;
      let release!: () => void;
      const bodyStarted = new Promise<void>((resolve) => { started = resolve; });
      const released = new Promise<void>((resolve) => { release = resolve; });
      heldBody = { pathname, started, released };
      const earlierRead = loadStateCached();
      await bodyStarted;
      try {
        const current = (await loadItemBundle("b"))!;
        current.item.institutionName = "After concurrent write";
        await saveItemBundle(current);
        listedEtags.set(pathname, previousEtag);
      } finally {
        release();
      }
      assert.equal((await earlierRead).items[0].institutionName, "Before concurrent write");
      resetCounts();
      assert.equal((await loadStateCached()).items[0].institutionName, "After concurrent write");
      assert.deepEqual(bodyReads, [pathname]);
      listedEtags.delete(pathname);
    });

    await t.test("cache keys include the Blob URL and all listing pages are read", async () => {
      objectPrefix = "/other-store/";
      const pathname = "moneytracker/v2/item__b.enc";
      documents.set(pathname, { ...documents.get(pathname)!, body: encrypt(JSON.stringify(bundle("b", "Other store"))) });
      putFixture("institution__claim", { itemId: "b", institutionId: "bank" });
      pageSize = 1;
      resetCounts();
      const state = await loadStateCached();
      assert.equal(state.items[0].institutionName, "Other store");
      assert.equal(listings, 3);
      assert.equal(bodyReads.length, 2);
      invalidCursor = true;
      await assert.rejects(loadStateCached(), /invalid pagination/);
      invalidCursor = false;
      pageSize = 1000;
    });

    await t.test("the entry limit evicts older documents without losing connections", async () => {
      documents.clear();
      putFixture("meta", emptyMeta());
      for (let index = 0; index < 17; index++) putFixture(`item__limit-${index}`, bundle(`limit-${index}`));
      assert.equal((await loadStateCached()).items.length, 17);
      resetCounts();
      assert.equal((await loadStateCached()).items.length, 17);
      assert.ok(bodyReads.length >= 2, "at least two of eighteen documents must be fetched again");
    });

    await t.test("the byte limit bypasses oversized documents and bounds total storage", async () => {
      documents.clear();
      putFixture("meta", emptyMeta());
      putFixture("item__huge", bundle("huge", "x".repeat(4 * 1024 * 1024)));
      await loadStateCached();
      resetCounts();
      assert.equal((await loadStateCached()).items[0].institutionName.length, 4 * 1024 * 1024);
      assert.deepEqual(bodyReads, ["moneytracker/v2/item__huge.enc"]);
      documents.delete("moneytracker/v2/item__huge.enc");
      for (const id of ["large-a", "large-b"]) putFixture(`item__${id}`, bundle(id, "x".repeat(2200 * 1024)));
      await loadStateCached();
      resetCounts();
      assert.equal((await loadStateCached()).items.length, 2);
      assert.ok(bodyReads.length >= 1, "combined encrypted strings exceed the 16 MiB budget");
    });
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    for (const [key, value] of previousEnv) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
