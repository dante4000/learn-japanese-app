"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Bound refreshes to the storage propagation window; cancellation prevents stale refreshes. */
export function scheduleSavedRefresh(refresh: () => void): () => void {
  refresh();
  const timers = [10_000, 30_000, 65_000].map((delay) => setTimeout(refresh, delay));
  return () => timers.forEach(clearTimeout);
}

/** Saved feedback belongs to the mutation owner. Financial values remain server-derived. */
export function useSavedRefresh() {
  const router = useRouter();
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
    cancel.current = scheduleSavedRefresh(() => { if (mounted.current) router.refresh(); });
  }, [router]);
  return { savedMessage, clearSavedFeedback, refreshAfterSave };
}
