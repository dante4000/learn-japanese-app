"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { formatMonth } from "@/lib/format";

// Navigates to ?month=yyyy-mm so the page can re-render server-side for the
// chosen month. Keeps the heavy analytics on the server.
export function MonthPicker({
  months,
  selected,
}: {
  months: string[];
  selected: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function go(month: string) {
    const next = new URLSearchParams(params.toString());
    next.set("month", month);
    router.push(`?${next.toString()}`);
  }

  return (
    <select
      value={selected}
      onChange={(e) => go(e.target.value)}
      className="tnum rounded-xl border hairline bg-surface px-3 py-2 text-sm text-cream outline-none focus:border-blue"
      aria-label="Select month"
    >
      {[...months].reverse().map((m) => (
        <option key={m} value={m}>
          {formatMonth(m)}
        </option>
      ))}
    </select>
  );
}
