"use client";

import { useRouter, useSearchParams } from "next/navigation";

/** Toggles ?rent=exclude on the Spending page to drop the Rent & Utilities
 *  category from every total on the tab. Included by default (no param); flips
 *  the URL so the page re-renders the rent-filtered view server-side. */
export function RentToggle({ excluded }: { excluded: boolean }) {
  const router = useRouter();
  const params = useSearchParams();

  function toggle() {
    const next = new URLSearchParams(params.toString());
    if (excluded) next.delete("rent");
    else next.set("rent", "exclude");
    const qs = next.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={!excluded}
      className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
        excluded
          ? "hairline bg-surface text-muted hover:text-cream"
          : "border-blue/40 bg-blue/15 text-blue"
      }`}
    >
      {excluded ? "Rent excluded" : "Rent included"}
    </button>
  );
}
