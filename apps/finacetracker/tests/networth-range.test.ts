import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { act, createElement } from "react";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { NetWorthArea } from "../src/components/charts/NetWorthArea";

test("one-point range retains its selected dates, suppresses change, and can return to all history", async () => {
  const window = new Window({ url: "http://localhost/" });
  const saved = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries({ window, document: window.document, navigator: window.navigator, HTMLElement: window.HTMLElement, ResizeObserver: window.ResizeObserver, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const { createRoot } = await import("react-dom/client");
  const host = window.document.createElement("div"); window.document.body.append(host);
  const root = createRoot(host as unknown as HTMLElement);
  const router: AppRouterInstance = { bfcacheId: "test", refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };
  try {
    await act(async () => root.render(createElement(AppRouterContext.Provider, { value: router }, createElement(NetWorthArea, { snapshots: [{ date: "2026-01-01", totalAssets: 100, totalLiabilities: 0, netWorth: 100 }, { date: "2026-10-01", totalAssets: 200, totalLiabilities: 0, netWorth: 200 }], currency: "USD" }))));
    const click = async (label: string) => { const button = [...host.querySelectorAll("button")].find((b) => b.textContent.trim() === label); assert.ok(button); await act(async () => button.click()); };
    await click("1M");
    assert.match(host.textContent, /Not enough records to calculate change/);
    assert.match(host.textContent, /1 records/); assert.doesNotMatch(host.textContent, /January|Jan ’/);
    assert.doesNotMatch(host.innerHTML, /NaN|Infinity/);
    await click("All"); assert.match(host.textContent, /2 records/); assert.match(host.textContent, /Jan/);
  } finally {
    await act(async () => root.unmount()); await window.happyDOM.close();
    for (const [key, value] of saved) { if (value) Object.defineProperty(globalThis, key, value); else Reflect.deleteProperty(globalThis, key); }
  }
});
