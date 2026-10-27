import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";
import { act, createElement } from "react";
import { DataTable } from "../src/components/DataTable";
import { TimeSeriesChart } from "../src/components/charts/TimeSeriesChart";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// Use a DOM for event tests. No bank data or browser session is needed.
test("tables support search, numeric sort, paging, column selection, export, and reset", async () => {
  const window = new Window({ url: "http://localhost" });
  const saved = new Map<string, PropertyDescriptor | undefined>();
  class ChartObserver {
    constructor(private callback: (entries: { contentRect: { width: number } }[]) => void) {}
    observe() { this.callback([{ contentRect: { width: 428 } }]); }
    disconnect() {}
  }
  for (const [key, value] of Object.entries({ window, document: window.document, navigator: window.navigator, HTMLElement: window.HTMLElement, HTMLInputElement: window.HTMLInputElement, Event: window.Event, MouseEvent: window.MouseEvent, ResizeObserver: ChartObserver, IS_REACT_ACT_ENVIRONMENT: true })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const { createRoot } = await import("react-dom/client");
  const container = window.document.createElement("div");
  window.document.body.append(container);
  const root = createRoot(container as unknown as HTMLElement);
  let selected = "";
  const rows = Array.from({ length: 42 }, (_, i) => ({ id: String(i), values: { period: `Period ${i}`, amount: 100 - i * 3 } }));
  const button = (label: string) => [...container.querySelectorAll("button")].find((el) => el.textContent?.trim() === label)!;
  const click = async (element: unknown) => { assert.ok(element instanceof window.HTMLElement); await act(async () => element.click()); };
  const originalCreate = URL.createObjectURL;
  const originalAnchorClick = window.HTMLAnchorElement.prototype.click;
  let exported: Blob | undefined;
  URL.createObjectURL = (blob) => { assert.ok(blob instanceof Blob); exported = blob; return "blob:table-test"; };
  window.HTMLAnchorElement.prototype.click = () => {};
  try {
    await act(async () => root.render(createElement(DataTable, { title: "Test records", rows, columns: [{ key: "period", label: "Period" }, { key: "amount", label: "Net", format: "money", total: true }], onSelectRow: (id) => { selected = id; } })));
    assert.equal(container.querySelectorAll("tbody tr").length, 25);
    await click(button("Next"));
    assert.equal(container.querySelectorAll("tbody tr").length, 17);
    const pageSize = container.querySelector("select")!;
    await act(async () => { pageSize.value = "10"; pageSize.dispatchEvent(new window.Event("change", { bubbles: true })); });
    assert.equal(container.querySelectorAll("tbody tr").length, 10);
    await click([...container.querySelectorAll("thead button")].find((el) => el.textContent?.includes("Net"))!);
    assert.match(container.querySelector("tbody tr")!.textContent, /Period 41.*−\$23\.00/);
    assert.equal(container.querySelector('th[aria-sort="ascending"]')?.textContent?.trim(), "Net↑");
    const input = container.querySelector('input[type="search"]')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!.call(input, "Period 39");
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
    });
    assert.equal(container.querySelectorAll("tbody tr").length, 1);
    assert.match(container.querySelector("tbody")!.textContent, /Period 39/);
    await click(container.querySelector("tbody button")!);
    assert.equal(selected, "39");
    await click(container.querySelector('input[type="checkbox"]:not(:disabled)')!);
    assert.equal(container.querySelectorAll("thead th").length, 1);
    await click(button("Export CSV"));
    const csv = await exported!.text();
    assert.match(csv, /"Period 39"/);
    assert.doesNotMatch(csv, /"Net"|"Period 38"/);
    await click(button("Reset"));
    assert.equal(container.querySelectorAll("thead th").length, 2);
    assert.equal(container.querySelectorAll("tbody tr").length, 25);
    assert.equal((container.querySelector('input[type="search"]') as unknown as HTMLInputElement).value, "");

    const router: AppRouterInstance = { bfcacheId: "test", back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch() {} };
    await act(async () => root.render(createElement(AppRouterContext.Provider, { value: router }, createElement(TimeSeriesChart, { title: "Monthly net", series: [{ key: "net", label: "Net", color: "blue" }], data: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((month, i) => ({ label: `${month} 26`, values: { net: 1000 + i * 100 } })) }))));
    const svg = container.querySelector("svg")!;
    assert.equal(svg.getAttribute("width"), "428");
    assert.equal(svg.style.minWidth, "", "fit mode must not clip the last months");
    for (const month of ["Sep 26", "Oct 26"]) assert.ok([...svg.querySelectorAll("text")].some((el) => el.textContent === month));
    await click(button("Expand chart"));
    assert.equal(svg.style.minWidth, "484px");
    await click(button("Fit all periods"));
    assert.equal(svg.style.minWidth, "");
    await click(button("Sep 26"));
    assert.match(container.querySelector('[aria-live="polite"]')!.textContent, /Sep 26.*\$1,400\.00/);
  } finally {
    await act(async () => root.unmount());
    URL.createObjectURL = originalCreate;
    window.HTMLAnchorElement.prototype.click = originalAnchorClick;
    await window.happyDOM.close();
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
