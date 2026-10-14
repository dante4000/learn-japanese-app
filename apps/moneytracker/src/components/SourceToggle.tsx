"use client";

import { useQuerySelection } from "./useQuerySelection";

/** Exact source filter; preserve month and period URL selections. */
export function SourcePicker({ sources, selected, hasSupport = false }: { sources: string[]; selected: string; hasSupport?: boolean }) {
  const { value, pending, select } = useQuerySelection("src", selected, "");
  return (
    <select
      aria-label="Income source"
      value={value}
      disabled={pending}
      aria-busy={pending}
      onChange={(event) => select(event.target.value)}
      className="min-h-11 min-w-0 max-w-full rounded-xl border hairline bg-surface px-3 py-2 text-base text-cream sm:text-sm"
    >
      <option value="">All income sources</option>
      {hasSupport && <option value="__employer_housing__">Studio rent support</option>}
      {sources.map((source) => <option key={source} value={source}>{source}</option>)}
    </select>
  );
}
