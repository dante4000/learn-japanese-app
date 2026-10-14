"use client";

import { useQuerySelection } from "./useQuerySelection";

/** Toggle recurring figures between monthly and annual via a URL param. */
export function PeriodToggle({ period }: { period: "monthly" | "annual" }) {
  const { value, pending, select } = useQuerySelection("period", period, "monthly");

  return (
    <div className="inline-flex rounded-lg border hairline bg-surface p-0.5 text-xs">
      {(["monthly", "annual"] as const).map((p) => (
        <button
          key={p}
          aria-pressed={value === p}
          onClick={() => select(p)}
          disabled={pending}
          aria-busy={pending}
          className={`min-h-11 lg:min-h-0 rounded-md px-2.5 py-1 capitalize transition-colors ${
            value === p ? "bg-surface-2 text-cream" : "text-muted hover:text-cream"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
