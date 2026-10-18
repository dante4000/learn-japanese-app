"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";

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

/** One nonblocking status owns feedback for overlapping actions. */
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = useState<Map<symbol, LoadingOperation>>(() => new Map());
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [selectionPending, startSelection] = useTransition();
  const selection = useMemo(() => [selectionPending, startSelection] as ReturnType<typeof useTransition>, [selectionPending, startSelection]);
  const busy = selectionPending || operations.size > 0;
  const hasInlineSkeleton = [...operations.values()].some((operation) => operation.inline);
  const showFeedback = busy && !hasInlineSkeleton;
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
    const timer = setTimeout(() => {
      setVisible(showFeedback);
      if (!showFeedback) setDismissed(false);
    }, showFeedback ? 450 : 0);
    return () => clearTimeout(timer);
  }, [showFeedback]);

  const labels = [...new Set([...operations.values()].filter((op) => !op.inline).map((op) => op.label))];
  if (selectionPending) labels.push("Updating filters…");

  return (
    <LoadingContext.Provider value={begin}>
      <SelectionContext.Provider value={selection}>{children}</SelectionContext.Provider>
      <p role="status" className="sr-only">{busy ? label : ""}</p>
      {showFeedback && visible && !dismissed && <aside aria-label="Work in progress" className="fixed bottom-24 right-4 z-40 w-[calc(100%-2rem)] max-w-sm rounded-2xl border hairline bg-surface p-5 text-cream shadow-xl sm:bottom-6 sm:right-6">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--color-line-2)] border-t-blue motion-reduce:animate-none" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{labels[0] ?? label}</p>
            {labels.length > 1 && <ul className="mt-2 space-y-1 text-xs text-muted">{labels.slice(1).map((message) => <li key={message}>{message}</li>)}</ul>}
            <p className="mt-1 text-xs text-muted">This closes when the action finishes.</p>
          </div>
          <button type="button" aria-label="Hide progress. The action will continue." onClick={() => setDismissed(true)} className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-cream">×</button>
        </div>
      </aside>}

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
      <p role="status" className="text-sm text-muted">Loading your dashboard…</p>
      <div aria-hidden="true" className="space-y-3"><SkeletonBlock className="h-8 w-44" /><SkeletonBlock className="h-3 w-3/5 max-w-sm" /></div>
      <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-3">{[0, 1, 2].map((key) => <div key={key} className="card p-5"><SkeletonSummary /></div>)}</div>
      <div aria-hidden="true" className="card space-y-6 p-5"><SkeletonBlock className="h-4 w-1/3" /><SkeletonRows /></div>
    </div>
  );
}
