"use client";

import { useOptimistic } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelectionTransition } from "./LoadingFeedback";

/** Acknowledge the choice at once; server results remain authoritative. */
export function useQuerySelection<T extends string>(key: string, selected: T, defaultValue?: T) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useOptimistic(selected);
  const [pending, startTransition] = useSelectionTransition();
  function select(nextValue: T) {
    if (pending || nextValue === value) return;
    const next = new URLSearchParams(params.toString());
    if (nextValue === defaultValue) next.delete(key);
    else next.set(key, nextValue);
    const query = next.toString();
    startTransition(() => {
      setValue(nextValue);
      router.push(query ? `?${query}` : "?", { scroll: false });
    });
  }
  return { value, pending, select };
}
