"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type Scope = "month" | "ytd" | "year";

const OPTIONS: [Scope, string][] = [
  ["month", "Monthly"],
  ["ytd", "YTD"],
  ["year", "12 mo"],
];

/** Switches the Income page between a single month, year-to-date, and the
 *  rolling 12-month window via a URL param. "month" is the default (no param). */
export function IncomeScope({ scope }: { scope: Scope }) {
  const router = useRouter();
  const params = useSearchParams();

  function set(s: Scope) {
    const next = new URLSearchParams(params.toString());
    if (s === "month") next.delete("scope");
    else next.set("scope", s);
    const qs = next.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  }

  return (
    <div className="inline-flex rounded-lg border hairline bg-surface p-0.5 text-xs">
      {OPTIONS.map(([v, label]) => (
        <button
          key={v}
          onClick={() => set(v)}
          className={`rounded-md px-2.5 py-1 transition-colors ${
            scope === v ? "bg-surface-2 text-cream" : "text-muted hover:text-cream"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
