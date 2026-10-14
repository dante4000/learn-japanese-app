"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";

type BeginLoading = (label: string) => () => void;
const LoadingContext = createContext<BeginLoading>(() => () => {});
const SelectionContext = createContext<ReturnType<typeof useTransition>>([false, () => {}]);

function Spinner() {
  return <span aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue/25 border-t-blue motion-reduce:animate-none" />;
}

/** One dialog owns feedback for overlapping actions and route transitions. */
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = useState<Map<symbol, string>>(() => new Map());
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [selectionPending, startSelection] = useTransition();
  const selection = useMemo(() => [selectionPending, startSelection] as ReturnType<typeof useTransition>, [selectionPending, startSelection]);
  const busy = selectionPending || operations.size > 0;
  const label = operations.values().next().value ?? (selectionPending ? "Updating view…" : "Loading view…");
  const begin = useCallback<BeginLoading>((message) => {
    const id = Symbol();
    setOperations((current) => new Map(current).set(id, message));
    return () => setOperations((current) => {
      if (!current.has(id)) return current;
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!busy || !dialog) return;
    // Fast actions show only the status. Dismissal lasts until this batch ends.
    const timer = setTimeout(() => { if (!dialog.open) dialog.showModal(); }, 450);
    return () => {
      clearTimeout(timer);
      if (dialog.open) dialog.close();
    };
  }, [busy]);

  return (
    <LoadingContext.Provider value={begin}>
      <SelectionContext.Provider value={selection}>{children}</SelectionContext.Provider>
      {busy && <div role="status" className="pointer-events-none fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 mx-auto flex w-fit max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-xl border hairline bg-ink-2 px-4 py-3 text-sm text-cream shadow-lg"><Spinner />{label}</div>}
      <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border hairline bg-ink-2 p-6 text-cream shadow-xl backdrop:bg-black/35">
        <div className="flex items-center gap-3"><Spinner /><h2 id={titleId} className="text-lg font-semibold">{label}</h2></div>
        <p id={descriptionId} className="mt-3 text-sm text-muted">You can keep browsing while this finishes.</p>
        <button type="button" autoFocus onClick={() => dialogRef.current?.close()} className="mt-5 min-h-11 w-full rounded-xl border hairline bg-surface px-4 py-2 text-sm text-cream hover:border-blue">Keep browsing</button>
      </dialog>
    </LoadingContext.Provider>
  );
}

export function useLoadingStatus(active: boolean, label: string) {
  const begin = useContext(LoadingContext);
  useEffect(() => {
    if (active) return begin(label);
  }, [active, begin, label]);
}

export function useLoadingTransition(label = "Loading view…") {
  const [pending, startTransition] = useTransition();
  useLoadingStatus(pending, label);
  return [pending, startTransition] as const;
}

/** Serialize filters so a second control cannot navigate from an old query. */
export function useSelectionTransition() {
  return useContext(SelectionContext);
}

export function LoadingView() {
  useLoadingStatus(true, "Loading view…");
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="min-h-[60dvh] space-y-6 py-4">
      <div aria-hidden="true" className="h-9 w-44 rounded-lg bg-surface-2" />
      <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-3">{[0, 1, 2].map((key) => <div key={key} className="card h-32" />)}</div>
      <div aria-hidden="true" className="card h-64" />
      <p role="status" className="text-sm text-muted">Loading your dashboard…</p>
    </div>
  );
}
