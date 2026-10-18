"use client";

import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { detailHref, type DetailData, type DetailQuery } from '@/lib/details';
import { formatTableValue } from '@/lib/table-data';
import { DataTable } from './DataTable';
import { TransactionRow, useTransactionEditor } from './TransactionRow';

const AccountContext = createContext({ account: 'all', rent: false });
export function DetailLink({ query, href, children, className = '', ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { query?: DetailQuery }) {
  const { account, rent } = useContext(AccountContext);
  const target = query ? detailHref({ account, ...query }) : href;
  let scoped = target;
  if (target?.startsWith('/details?')) {
    const params = new URLSearchParams(target.split('?')[1]);
    if (rent && !params.has('rent') && ['spending', 'net', 'rate'].includes(params.get('metric') ?? '')) params.set('rent', 'exclude');
    if (!params.has('account')) params.set('account', account);
    scoped = `/details?${params}`;
  }
  return <a {...props} href={scoped} className={`detail-link ${className}`}>{children}</a>;
}

export function DetailContent({ data }: { data: DetailData }) {
  const editor = useTransactionEditor();
  return <div className="min-w-0 space-y-5">
    <div className="flex flex-wrap gap-2 text-sm text-muted">{data.scope.map((scope, i) => <span className="rounded-lg border hairline px-3 py-2" key={i}>{scope}</span>)}</div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{data.summary.map((item, i) => <div key={i} className={`rounded-xl border hairline bg-surface-2 p-4 ${i === 0 ? "col-span-2 lg:col-span-1" : ""}`}><p className="text-xs text-muted">{item.label}</p><p className="tnum mt-2 break-words text-xl text-cream">{formatTableValue(item.value, { key: 'value', label: item.label, format: item.format }, data.currency)}</p></div>)}</div>
    <div className="space-y-2 text-sm text-muted">{data.notes.map((note, i) => <p className="break-words" key={i}>{note}</p>)}</div>
    {data.transaction && <section className="rounded-xl border hairline"><h2 className="px-4 pt-4 font-medium text-cream">Entry and actions</h2><ul><TransactionRow t={data.transaction} accountName={data.accountName} currency={data.transaction.currency} editor={editor} inspectable={false} /></ul>{editor.savedMessage && <p className="p-4 text-sm text-muted" role="status">{editor.savedMessage} Close and reopen this detail to load saved values.</p>}{editor.error && <p className="p-4 text-coral" role="alert">{editor.error}</p>}</section>}
    <DataTable title={data.title} columns={data.columns} rows={data.rows} currency={data.currency} />
    {data.actions.length > 0 && <nav aria-label="Related details" className="flex flex-wrap gap-4">{data.actions.map((action) => <DetailLink key={action.href} href={action.href}>{action.label} →</DetailLink>)}</nav>}
  </div>;
}

export function DetailProvider({ account, children }: { account: string | null; children?: ReactNode }) {
  const searchParams = useSearchParams();
  const dialog = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  const trigger = useRef<HTMLElement | null>(null);
  const origin = useRef<string | null>(null);
  const depth = useRef(0);
  const [url, setUrl] = useState<string | null>(() => searchParams?.get('detail') ?? null);
  const [remote, setRemote] = useState<{ key: string; data?: DetailData; error?: string } | null>(null);
  const [slowKey, setSlowKey] = useState('');
  const [historyDepth, setHistoryDepth] = useState(0);
  const [retry, setRetry] = useState(0);
  const requestKey = `${url}:${retry}`;
  const data = remote?.key === requestKey || !url ? remote?.data : undefined;
  const error = remote?.key === requestKey ? remote.error : undefined;
  const slow = slowKey === requestKey;
  const open = Boolean(url);
  useEffect(() => {
    function current() { return new URLSearchParams(location.search).get('detail'); }
    function pop() { const detail = history.state?.moneytrackerDetail; setUrl(current()); setRetry((v) => v + 1); depth.current = current() ? detail?.depth ?? 0 : 0; origin.current = current() ? detail?.origin ?? null : null; setHistoryDepth(depth.current); }
    function click(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const target = new URL(anchor.getAttribute('href')!, location.href);
      if (target.origin !== location.origin || target.pathname !== '/details') { if (current()) { setUrl(null); depth.current = 0; origin.current = null; setHistoryDepth(0); } return; }
      event.preventDefault(); event.stopPropagation();
      if (!current()) { trigger.current = anchor; origin.current = location.href; depth.current = 0; }
      const page = new URL(location.href);
      page.searchParams.set('detail', target.search.slice(1));
      depth.current += 1;
      history.pushState({ ...history.state, moneytrackerDetail: { depth: depth.current, origin: origin.current } }, '', page);
      setHistoryDepth(depth.current); setRetry((v) => v + 1); setUrl(target.search.slice(1));
    }
    document.addEventListener('click', click, true); window.addEventListener('popstate', pop);
    return () => { document.removeEventListener('click', click, true); window.removeEventListener('popstate', pop); };
  }, []);
  useEffect(() => {
    if (!open) { dialog.current?.close(); trigger.current?.focus(); return; }
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [open]); // The dialog stays open while nested details load.
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => setSlowKey(requestKey), 450);
    fetch(`/api/details?${url}`, { signal: controller.signal, cache: 'no-store' }).then(async (response) => {
      const body = await response.json().catch(() => ({ error: "Could not load details. Try again." }));
      if (!response.ok || body.error) throw new Error(body.error || 'Could not load details.');
      if (!controller.signal.aborted) setRemote({ key: requestKey, data: body });
    }).catch((cause) => { if (!controller.signal.aborted) setRemote({ key: requestKey, error: cause instanceof Error ? cause.message : 'Could not load details.' }); });
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [url, requestKey]);
  function close() {
    if (origin.current && depth.current) history.go(-depth.current);
    else { const page = new URL(location.href); page.searchParams.delete('detail'); history.replaceState(history.state, '', page); setUrl(null); }
  }
  function outsidePanel(event: React.MouseEvent<HTMLDialogElement> | React.PointerEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return false;
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }
  return <AccountContext value={{ account: account ?? 'all', rent: searchParams?.get('rent') === 'exclude' }}>{children}<dialog ref={dialog} className="detail-dialog" aria-labelledby="detail-title" onCancel={(event) => { event.preventDefault(); close(); }} onPointerDown={(event) => { backdropPress.current = outsidePanel(event); }} onClick={(event) => { if (backdropPress.current && outsidePanel(event)) close(); backdropPress.current = false; }}>
    <header className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b hairline bg-surface px-4 py-4 sm:px-6">
      <h2 id="detail-title" className="max-h-24 min-w-0 overflow-y-auto break-words text-xl text-cream">{data?.title ?? 'Financial details'}</h2>
      <div className="flex items-center gap-3">{historyDepth > 1 && <button type="button" onClick={() => history.back()} className="min-h-11 px-2 text-blue">Back</button>}{url && <a className="detail-link" href={`/details?${url}`} target="_blank" rel="noreferrer">Open full page ↗</a>}<button autoFocus type="button" aria-label="Close details" onClick={close} className="min-h-11 rounded-lg border hairline px-4 text-cream">Close</button></div>
    </header>
    <div className="min-w-0 p-4 sm:p-6" aria-busy={Boolean(url && !data && !error)}>
      {data ? <div key={remote?.key} className="detail-content"><DetailContent data={data} /></div> : error ? <div role="alert"><p className="text-coral">{error}</p><button type="button" onClick={() => setRetry((v) => v + 1)} className="detail-link mt-4">Retry</button></div> : <div role="status" className="min-h-40 text-muted">{slow ? <><p>Loading supporting records…</p><div className="loading-skeleton mt-4 h-24 rounded-xl bg-surface-2" /></> : 'Opening details…'}</div>}
    </div>
  </dialog></AccountContext>;
}
