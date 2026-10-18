"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoadingTransition } from "./LoadingFeedback";

/** Bound refreshes to the storage propagation window; cancellation prevents stale refreshes. */
export function scheduleSavedRefresh(refresh: () => void): () => void {
  refresh();
  const timers = [10_000, 30_000, 65_000].map((delay) => setTimeout(refresh, delay));
  return () => timers.forEach(clearTimeout);
}

/** Saved feedback belongs to the mutation owner. Financial values remain server-derived. */
export function useSavedRefresh() {
  const router = useRouter();
  const [, startTransition] = useLoadingTransition("Updating view…");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const cancel = useRef<() => void>(() => {});
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancel.current();
    };
  }, []);
  const clearSavedFeedback = useCallback(() => {
    if (!mounted.current) return;
    cancel.current();
    setSavedMessage(null);
  }, []);
  const refreshAfterSave = useCallback(() => {
    if (!mounted.current) return;
    cancel.current();
    setSavedMessage("Saved. Updates can take up to a minute to appear.");
    let first = true;
    cancel.current = scheduleSavedRefresh(() => {
      if (!mounted.current) return;
      if (first) startTransition(() => router.refresh());
      else router.refresh();
      first = false;
    });
  }, [router, startTransition]);
  return { savedMessage, clearSavedFeedback, refreshAfterSave };
}
