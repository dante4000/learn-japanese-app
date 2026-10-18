import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { act, createElement } from "react";
import { CreditCardsView, type CardViewData } from "../src/components/CreditCardsView";
import { CARD_CATALOG } from "../src/lib/cards";

test("closed and unlinked cards stay out of totals; failed status saves keep the current state", async () => {
  const window = new Window({ url: "http://localhost/cards" });
  const saved = new Map<string, PropertyDescriptor | undefined>();
  let fail = true;
  const requests: unknown[] = [];
  for (const [key, value] of Object.entries({ window, document: window.document, navigator: window.navigator, localStorage: window.localStorage, IS_REACT_ACT_ENVIRONMENT: true, fetch: async (_url: string, init: RequestInit) => {
    requests.push(JSON.parse(String(init.body)));
    return fail ? Response.json({ error: "Save failed. Retry." }, { status: 500 }) : Response.json({ ok: true });
  } })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const live: NonNullable<CardViewData["live"]> = { accountName: "Card", mask: "1234", balance: 0, limit: 1000, spend12mo: 0, spendYtd: 0, txnCount: 0, estPoints: 0, estPointsCashValue: 0, estPointsTransferValue: 0, pointsLines: [], creditUsage: [] };
  const card = { ...CARD_CATALOG[0], credits: [], annualFee: 100 };
  const cards: CardViewData[] = [
    { card: { ...card, cardKey: "active", displayName: "Active card" }, status: "active", reported: true, live, renewal: null },
    { card: { ...card, cardKey: "sapphire-reserve", displayName: "Closed Reserve", annualFee: 795 }, status: "closed", reported: true, historyAccountId: "reserve", live, renewal: null },
    { card: { ...card, cardKey: "unlinked", displayName: "Unlinked card", annualFee: 500 }, status: "unlinked", reported: false, live: null, renewal: null },
  ];
  const { createRoot } = await import("react-dom/client");
  const container = window.document.createElement("div"); window.document.body.append(container);
  const root = createRoot(container as unknown as HTMLElement);
  const fees = () => [...container.querySelectorAll(".label-eyebrow")].find((el) => el.textContent === "Annual fees")!.parentElement!.textContent;
  const click = async (label: string) => {
    const button = [...container.querySelectorAll("button")].find((el) => el.textContent === label)!;
    assert.ok(button); await act(async () => button.click());
  };
  const router: AppRouterInstance = { bfcacheId: "test", refresh() {}, push() {}, replace() {}, back() {}, forward() {}, prefetch() {} };
  try {
    await act(async () => root.render(createElement(AppRouterContext.Provider, { value: router }, createElement(CreditCardsView, { cards, unmatched: [], currency: "USD" }))));
    assert.match(fees(), /\$100/);
    assert.match(fees(), /1 active linked cards/);
    assert.equal(container.querySelector('[href="/details?account=reserve&currency=USD&metric=ledger"]') !== null, true);
    assert.equal(container.querySelector("#card-sapphire-reserve"), null);
    await click("Undo closed status");
    assert.match(container.querySelector('[role="alert"]')!.textContent, /Save failed/);
    assert.match(fees(), /\$100/);
    fail = false;
    await click("Undo closed status");
    assert.match(fees(), /\$895/);
    assert.ok(container.querySelector("#card-sapphire-reserve"));
    await act(async () => (container.querySelector("#card-sapphire-reserve") as unknown as HTMLElement).click());
    await click("Mark closed");
    assert.match(fees(), /\$100/);
    assert.equal(container.querySelector("#card-sapphire-reserve"), null);
    assert.deepEqual(requests.at(-1), { cardKey: "sapphire-reserve", status: "closed" });
  } finally {
    await act(async () => root.unmount());
    await window.happyDOM.close();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
