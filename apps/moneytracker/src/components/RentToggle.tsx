"use client";

import { useQuerySelection } from "./useQuerySelection";

/** Toggles ?rent=exclude on the Spending page to drop the Rent & Utilities
 *  category from every total on the tab. Included by default (no param); flips
 *  the URL so the page re-renders the rent-filtered view server-side. */
export function RentToggle({ excluded }: { excluded: boolean }) {
  const { value, pending, select } = useQuerySelection("rent", excluded ? "exclude" : "", "");
  const isExcluded = value === "exclude";

  return (
    <button
      onClick={() => select(isExcluded ? "" : "exclude")}
      disabled={pending}
      aria-busy={pending}
      aria-pressed={!isExcluded}
      className={`min-h-11 lg:min-h-0 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
        isExcluded
          ? "hairline bg-surface text-muted hover:text-cream"
          : "border-blue/40 bg-blue/15 text-blue"
      }`}
    >
      {isExcluded ? "Rent excluded" : "Rent included"}
    </button>
  );
}
