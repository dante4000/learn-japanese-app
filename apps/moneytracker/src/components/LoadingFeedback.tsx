"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, useTransition } from "react";

type LoadingOperation = { label: string; inline: boolean };
type BeginLoading = (label: string, inline?: boolean) => () => void;
const LoadingContext = createContext<BeginLoading>(() => () => {});
const SelectionContext = createContext<ReturnType<typeof useTransition>>([false, () => {}]);

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`loading-skeleton ${className}`} />;
}

function SkeletonSummary() {
  return (
    <div className="space-y-3">
      <SkeletonBlock className="h-2.5 w-2/5" />
      <SkeletonBlock className="h-7 w-3/4" />
      <SkeletonBlock className="h-2.5 w-1/2" />
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-5">
      {["w-3/4", "w-1/2", "w-2/3"].map((width) => (
        <div key={width} className="flex items-center gap-3">
          <SkeletonBlock className="h-9 w-9 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className={`h-2.5 ${width}`} />
            <SkeletonBlock className="h-2 w-1/3" />
          </div>
          <SkeletonBlock className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** One dialog owns feedback for overlapping actions and route transitions. */
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = useState<Map<symbol, LoadingOperation>>(() => new Map());
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [selectionPending, startSelection] = useTransition();
  const selection = useMemo(() => [selectionPending, startSelection] as ReturnType<typeof useTransition>, [selectionPending, startSelection]);
  const busy = selectionPending || operations.size > 0;
  const hasInlineSkeleton = [...operations.values()].some((operation) => operation.inline);
  const showDialog = busy && !hasInlineSkeleton;
  const label = operations.values().next().value?.label ?? (selectionPending ? "Updating view…" : "Loading view…");
  const begin = useCallback<BeginLoading>((message, inline = false) => {
    const id = Symbol();
    setOperations((current) => new Map(current).set(id, { label: message, inline }));
    return () => setOperations((current) => {
      if (!current.has(id)) return current;
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!showDialog || !dialog) return;
    // A page skeleton owns feedback while visible. Fast actions avoid the modal.
    const timer = setTimeout(() => { if (!dialog.open) dialog.showModal(); }, 450);
    return () => {
      clearTimeout(timer);
      if (dialog.open) dialog.close();
    };
  }, [showDialog]);

  return (
    <LoadingContext.Provider value={begin}>
      <SelectionContext.Provider value={selection}>{children}</SelectionContext.Provider>
      <p role="status" className="sr-only">{busy ? label : ""}</p>
      <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId} className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-2xl border hairline bg-surface p-6 text-cream shadow-xl backdrop:bg-black/25">
        <h2 id={titleId} className="sr-only">{label}</h2>
        <p id={descriptionId} className="sr-only">You can keep browsing while this finishes.</p>
        <div aria-hidden="true" className="space-y-6">
          <SkeletonSummary />
          <div className="border-t hairline pt-6"><SkeletonRows /></div>
        </div>
        <button type="button" autoFocus onClick={() => dialogRef.current?.close()} className="mt-5 min-h-11 w-full rounded-xl border hairline bg-surface px-4 py-2 text-sm text-cream hover:border-blue">Keep browsing</button>
      </dialog>
    </LoadingContext.Provider>
  );
}

export function useLoadingStatus(active: boolean, label: string, inline = false) {
  const begin = useContext(LoadingContext);
  useEffect(() => {
    if (active) return begin(label, inline);
  }, [active, begin, label, inline]);
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
  useLoadingStatus(true, "Loading view…", true);
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="min-h-[60dvh] space-y-6 py-4">
      <div aria-hidden="true" className="space-y-3"><SkeletonBlock className="h-8 w-44" /><SkeletonBlock className="h-3 w-3/5 max-w-sm" /></div>
      <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-3">{[0, 1, 2].map((key) => <div key={key} className="card p-5"><SkeletonSummary /></div>)}</div>
      <div aria-hidden="true" className="card space-y-6 p-5"><SkeletonBlock className="h-4 w-1/3" /><SkeletonRows /></div>
    </div>
  );
}
