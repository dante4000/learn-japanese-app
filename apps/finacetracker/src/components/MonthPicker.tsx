"use client";

import { useQuerySelection } from "./useQuerySelection";
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
  const { value, pending, select } = useQuerySelection("month", selected);

  return (
    <select
      value={value}
      disabled={pending}
      aria-busy={pending}
      onChange={(e) => select(e.target.value)}
      className="tnum min-h-11 max-w-full rounded-xl border hairline bg-surface px-3 py-2 text-base sm:text-sm text-cream outline-none focus:border-blue"
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
