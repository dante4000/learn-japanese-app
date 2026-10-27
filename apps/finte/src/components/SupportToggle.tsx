"use client";

import { useQuerySelection } from "./useQuerySelection";

/** Toggles ?support=include so the Income chart stacks employer-paid studio
 *  rent on top of recorded deposits. Off by default (bank income only). */
export function SupportToggle({ included }: { included: boolean }) {
  const { value, pending, select } = useQuerySelection("support", included ? "include" : "", "");
  const isIncluded = value === "include";

  return (
    <button
      onClick={() => select(isIncluded ? "" : "include")}
      disabled={pending}
      aria-busy={pending}
      aria-pressed={isIncluded}
      className={`min-h-11 lg:min-h-0 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
        isIncluded
          ? "border-blue/40 bg-blue/15 text-blue"
          : "hairline bg-surface text-muted hover:text-cream"
      }`}
    >
      {isIncluded ? "Studio rent added" : "Add studio rent"}
    </button>
  );
}
