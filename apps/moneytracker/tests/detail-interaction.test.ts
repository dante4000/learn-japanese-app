import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { act, createElement } from 'react';
import { DetailLink, DetailProvider } from '../src/components/DetailPanel';
import { DataTable } from '../src/components/DataTable';
import { detailHref, type DetailData } from '../src/lib/details';
import { AppRouterContext, type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { SearchParamsContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';

const payload = (title: string): DetailData => ({ title, scope: ['2026-10', 'Checking'], currency: 'USD', summary: [{ label: 'Net spending', value: 120, format: 'money' }], notes: ['Purchases minus refunds.'], columns: [{ key: 'name', label: 'Entry' }, { key: 'amount', label: 'Contribution', format: 'money' }], rows: [{ id: 'record', href: detailHref({ metric: 'transaction', record: 'record', account: 'checking' }), linkLabel: 'Inspect entry', values: { name: 'Full bank description', amount: 120 } }], actions: [] });

test('detail links preserve filters, handle races and retry, retain origin controls, and restore history', async () => {
  const window = new Window({ url: 'http://localhost/spending?month=2026-10&rent=exclude' });
  const saved = new Map<string, PropertyDescriptor | undefined>();
  const requests: { url: string; signal: AbortSignal; finish: (response: Response) => void }[] = [];
  for (const [key, value] of Object.entries({ window, document: window.document, location: window.location, history: window.history, navigator: window.navigator, HTMLElement: window.HTMLElement, HTMLInputElement: window.HTMLInputElement, Event: window.Event, MouseEvent: window.MouseEvent, IS_REACT_ACT_ENVIRONMENT: true, fetch: (url: string, init: RequestInit) => new Promise<Response>((finish) => requests.push({ url, signal: init.signal!, finish })) })) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key)); Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const { createRoot } = await import('react-dom/client');
  const container = window.document.createElement('div'); window.document.body.append(container);
  const root = createRoot(container as unknown as HTMLElement);
  const router: AppRouterInstance = { bfcacheId: 'test', back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch() {} };
  const find = (text: string) => [...container.querySelectorAll('a, button')].find((el) => el.textContent?.trim() === text)!;
  const click = async (el: unknown) => { assert.ok(el instanceof window.HTMLElement); await act(async () => el.click()); };
  const respond = async (index: number, title: string, status = 200) => act(async () => { requests[index].finish(Response.json(status === 200 ? payload(title) : { error: title }, { status })); await Promise.resolve(); });
  try {
    await act(async () => root.render(createElement(AppRouterContext.Provider, { value: router }, createElement(SearchParamsContext.Provider, { value: new URLSearchParams('month=2026-10&rent=exclude') }, createElement(DetailProvider, { account: 'checking' }, [
      createElement(DetailLink, { key: 'a', query: { metric: 'spending', category: 'GENERAL_MERCHANDISE', months: ['2026-10'] } }, 'Shopping $120'),
      createElement(DetailLink, { key: 'b', query: { metric: 'spending', category: 'OTHER', months: ['2026-10'] } }, 'Other −$120'),
      createElement(DataTable, { key: 'table', title: 'Origin table', columns: [{ key: 'name', label: 'Name' }, { key: 'amount', label: 'Amount', format: 'money' }], rows: [{ id: 'a', cellHrefs: { amount: detailHref({ metric: 'spending', months: ['2026-10'] }) }, values: { name: 'October', amount: 120 } }] }),
    ])))));
    const originSearch = container.querySelector('input[type="search"]')!;
    await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(originSearch, 'October'); originSearch.dispatchEvent(new window.Event('input', { bubbles: true })); });
    const trigger = find('Shopping $120');
    assert.match(trigger.getAttribute('href')!, /account=checking/); assert.match(trigger.getAttribute('href')!, /rent=exclude/);
    await click(trigger);
    assert.equal(container.querySelector('dialog')?.open, true);
    assert.equal(requests.length, 1); assert.match(requests[0].url, /GENERAL_MERCHANDISE/);
    assert.equal(window.document.body.style.overflow, 'hidden');
    assert.match(window.location.search, /detail=/);
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 470)); });
    assert.match(container.querySelector('dialog')!.textContent, /Loading supporting records/);
    // Simulate a second selection arriving before the first response.
    await click(find('Other −$120'));
    assert.equal(requests[0].signal.aborted, true);
    await respond(1, 'Other detail'); await respond(0, 'Stale shopping detail');
    assert.match(container.querySelector('#detail-title')!.textContent, /Other detail/);
    assert.doesNotMatch(container.querySelector('dialog')!.textContent, /Stale shopping/);
    await click(find('Inspect entry'));
    await respond(2, 'Temporary failure', 503);
    assert.match(container.querySelector('[role="alert"]')!.textContent, /Temporary failure/);
    await click(find('Retry')); await respond(3, 'Entry detail');
    assert.match(container.querySelector('#detail-title')!.textContent, /Entry detail/);
    assert.equal((originSearch as unknown as HTMLInputElement).value, 'October');
    // Happy DOM does not emit popstate for history traversal. Dispatch the browser event.
    await act(async () => { window.history.replaceState({}, '', '/spending?month=2026-10&rent=exclude'); window.dispatchEvent(new window.PopStateEvent('popstate')); });
    assert.equal(container.querySelector('dialog')?.open, false);
    assert.equal(window.document.body.style.overflow, '');
    assert.equal(window.document.activeElement, trigger);
    assert.equal((originSearch as unknown as HTMLInputElement).value, 'October');
  } finally {
    await act(async () => root.unmount()); await window.happyDOM.close();
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  }
});
