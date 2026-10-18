"use client";

import { useQuerySelection } from "./useQuerySelection";

export type Scope = "month" | "ytd" | "year" | "all";

const OPTIONS: [Scope, string][] = [
  ["month", "Monthly"],
  ["ytd", "YTD"],
  ["year", "12 mo"],
  ["all", "All"],
];

/** Switches the Income page between a single month, year-to-date, and the
 *  rolling 12-month window or all history via a URL param. "month" is the default (no param). */
export function IncomeScope({ scope }: { scope: Scope }) {
  const { value, pending, select } = useQuerySelection("scope", scope, "month");

  return (
    <div className="inline-flex rounded-lg border hairline bg-surface p-0.5 text-xs">
      {OPTIONS.map(([v, label]) => (
        <button
          key={v}
          aria-pressed={value === v}
          onClick={() => select(v)}
          disabled={pending}
          aria-busy={pending}
          className={`min-h-11 lg:min-h-0 rounded-md px-2.5 py-1 transition-colors ${
            value === v ? "bg-surface-2 text-cream" : "text-muted hover:text-cream"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
