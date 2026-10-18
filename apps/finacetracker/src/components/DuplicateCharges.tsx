"use client";

import { useEffect, useState } from "react";
import { DuplicateGroup } from "@/lib/analytics";
import { formatDate, formatMoney } from "@/lib/format";

const STORAGE_KEY = "finacetracker.duplicate-dismissals.v1";
const LEGACY_STORAGE_KEY = "mt.duplicate-dismissals.v1";
const groupKey = (group: DuplicateGroup) => JSON.stringify(group.transactions.map((t) => t.id).sort());

/** Review inbox; dismissal changes only this device's review list. */
export function DuplicateCharges({ groups, accountNames, currency, onReview }: {
  groups: DuplicateGroup[];
  accountNames: Map<string, string>;
  currency: string;
  onReview: (ids: string[]) => void;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [limit, setLimit] = useState(12);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved) && saved.every((key) => typeof key === "string")) {
        // Load device preferences after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDismissed(saved);
      }
    } catch { /* Keep the review list if storage is unavailable. */ }
  }, []);
  function save(next: string[]) {
    setDismissed(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      setNotice("");
    } catch { setNotice("Dismissal applies for this visit. Device storage is unavailable."); }
  }
  const visible = groups.filter((group) => !dismissed.includes(groupKey(group)));
  if (!groups.length) return null;
  return (
    <details className="card mb-4 p-4 sm:p-5">
      <summary className="min-h-11 cursor-pointer text-base text-cream">Possible duplicate charges · {visible.length}</summary>
      <p className="mb-3 mt-3 text-xs text-muted">Equal purchases at the same merchant, on the same account, posted within one day. These can be valid repeat purchases. Review the exact rows before changing any transaction. Dismissal does not change spending.</p>
      <ul className="space-y-2">
        {visible.slice(0, limit).map((group) => (
          <li key={groupKey(group)} className="rounded-xl border hairline bg-surface p-3">
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="break-words text-sm text-cream">{group.merchant} · {group.transactions.length} charges</div>
                <div className="text-xs text-muted">{formatDate(group.date)}{group.transactions.at(-1)?.date !== group.date ? ` – ${formatDate(group.transactions.at(-1)!.date)}` : ""} · {accountNames.get(group.accountId) ?? "Account"}</div>
              </div>
              <div className="tnum whitespace-nowrap text-sm text-coral">{formatMoney((group.transactions.length - 1) * group.amount, group.transactions[0]?.currency ?? currency)} potential extra</div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => onReview(group.transactions.map((t) => t.id))} className="min-h-11 rounded-lg border hairline px-3 py-2 text-xs text-blue">Review charges</button>
              <button type="button" onClick={() => save([...dismissed, groupKey(group)])} className="min-h-11 rounded-lg px-3 py-2 text-xs text-muted">Dismiss as valid</button>
            </div>
          </li>
        ))}
      </ul>
      {visible.length > limit && <button type="button" onClick={() => setLimit((n) => n + 12)} className="mt-3 min-h-11 rounded-lg border hairline px-3 py-2 text-xs text-cream">Show more candidates</button>}
      {dismissed.length > 0 && <button type="button" onClick={() => save([])} className="mt-3 min-h-11 rounded-lg px-3 py-2 text-xs text-muted">Restore dismissed candidates</button>}
      {notice && <p role="status" className="mt-2 text-xs text-muted">{notice}</p>}
    </details>
  );
}
