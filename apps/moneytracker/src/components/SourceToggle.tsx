"use client";

import { useRouter, useSearchParams } from "next/navigation";

/** Exact source filter; preserve month and period URL selections. */
export function SourcePicker({ sources, selected, hasSupport = false }: { sources: string[]; selected: string; hasSupport?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <select
      aria-label="Income source"
      value={selected}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) next.set("src", event.target.value);
        else next.delete("src");
        const query = next.toString();
        router.push(query ? `?${query}` : "?", { scroll: false });
      }}
      className="min-h-11 min-w-0 max-w-full rounded-xl border hairline bg-surface px-3 py-2 text-base text-cream sm:text-sm"
    >
      <option value="">All income sources</option>
      {hasSupport && <option value="__employer_housing__">Studio rent support</option>}
      {sources.map((source) => <option key={source} value={source}>{source}</option>)}
    </select>
  );
}
