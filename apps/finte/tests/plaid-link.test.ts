import test from "node:test";
import assert from "node:assert/strict";
import { exchangePlaidToken, loadPlaidScript, PLAID_LINK_TOKEN_KEY } from "../src/lib/plaid-link";

test("Plaid loader shares pending loads, clears listeners, and retries failed tags", async () => {
  const priorWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const priorDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  let tag: Script | null = null;
  let appended = 0;
  class Script extends EventTarget {
    src = "";
    listeners = new Set<EventListenerOrEventListenerObject>();
    override addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      this.listeners.add(listener);
      super.addEventListener(type, listener);
    }
    override removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      this.listeners.delete(listener);
      super.removeEventListener(type, listener);
    }
    remove() { tag = null; }
  }
  const win: { Plaid?: object } = {};
  Object.defineProperty(globalThis, "window", { configurable: true, value: win });
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    querySelector: () => tag,
    createElement: () => new Script(),
    body: { appendChild: (script: Script) => { tag = script; appended++; } },
  } });
  try {
    const first = loadPlaidScript();
    const same = loadPlaidScript();
    assert.equal(first, same);
    assert.equal(appended, 1);
    const loadedTag = tag! as Script;
    win.Plaid = {};
    loadedTag.dispatchEvent(new Event("load"));
    await first;
    assert.equal(loadedTag.listeners.size, 0);
    delete win.Plaid;
    const failed = loadPlaidScript();
    const rejected = assert.rejects(failed, /Failed to load Plaid/);
    loadedTag.dispatchEvent(new Event("error"));
    await rejected;
    assert.equal(tag, null);
    assert.equal(loadedTag.listeners.size, 0);
    const retry = loadPlaidScript();
    assert.equal(appended, 2);
    win.Plaid = {};
    (tag! as Script).dispatchEvent(new Event("load"));
    await retry;
  } finally {
    if (priorWindow) Object.defineProperty(globalThis, "window", priorWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (priorDocument) Object.defineProperty(globalThis, "document", priorDocument);
    else Reflect.deleteProperty(globalThis, "document");
  }
});

test("Plaid exchange preserves saved warnings and clears only successful resumable tokens", async () => {
  const priorFetch = globalThis.fetch;
  const priorStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const removed: string[] = [];
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { removeItem: (key: string) => removed.push(key) } });
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ institutionName: "Bank", warning: "Snapshot needs refresh." }), { status: 200 });
    assert.deepEqual(await exchangePlaidToken("test-token"), { institutionName: "Bank", warning: "Snapshot needs refresh." });
    assert.deepEqual(removed, [PLAID_LINK_TOKEN_KEY]);
    globalThis.fetch = async () => new Response(JSON.stringify({ error: "Already connected" }), { status: 409 });
    await assert.rejects(exchangePlaidToken("test-token"), /Already connected/);
    assert.equal(removed.length, 1);
  } finally {
    globalThis.fetch = priorFetch;
    if (priorStorage) Object.defineProperty(globalThis, "localStorage", priorStorage);
    else Reflect.deleteProperty(globalThis, "localStorage");
  }
});
