"use client";

import { useRouter, useSearchParams } from "next/navigation";

/** Toggle recurring figures between monthly and annual via a URL param. */
export function PeriodToggle({ period }: { period: "monthly" | "annual" }) {
  const router = useRouter();
  const params = useSearchParams();
  function set(p: "monthly" | "annual") {
    const next = new URLSearchParams(params.toString());
    if (p === "monthly") next.delete("period");
    else next.set("period", p);
    const qs = next.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  }
  return (
    <div className="inline-flex rounded-lg border hairline bg-surface p-0.5 text-xs">
      {(["monthly", "annual"] as const).map((p) => (
        <button
          key={p}
          onClick={() => set(p)}
          className={`rounded-md px-2.5 py-1 capitalize transition-colors ${
            period === p ? "bg-surface-2 text-cream" : "text-muted hover:text-cream"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
