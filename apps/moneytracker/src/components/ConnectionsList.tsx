"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Item } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function ConnectionsList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(id: string, name: string) {
    if (!confirm(`Remove ${name}? This deletes its accounts and transactions and revokes access.`))
      return;
    setBusy(id);
    await fetch(`/api/items/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  if (items.length === 0)
    return (
      <p className="py-6 text-center text-sm text-muted">
        No connections yet. Connect a bank or import a CSV below.
      </p>
    );

  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li
          key={it.id}
          className="flex items-center gap-3 rounded-xl border hairline bg-surface px-4 py-3"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              it.status === "healthy"
                ? "bg-blue"
                : it.status === "needs_reauth"
                  ? "bg-slate"
                  : "bg-coral"
            }`}
          />
          <div className="min-w-0">
            <div className="text-sm text-cream">{it.institutionName}</div>
            <div className="text-xs text-faint">
              {it.provider === "plaid" ? "Plaid" : "CSV import"}
              {it.lastSyncedAt ? ` · synced ${formatDate(it.lastSyncedAt.slice(0, 10))}` : ""}
              {it.status === "error" && it.error ? ` · ${it.error}` : ""}
            </div>
          </div>
          <button
            onClick={() => remove(it.id, it.institutionName)}
            disabled={busy === it.id}
            className="ml-auto rounded-lg px-3 py-1.5 text-xs text-faint transition-colors hover:text-coral disabled:opacity-50"
          >
            {busy === it.id ? "Removing…" : "Remove"}
          </button>
        </li>
      ))}
    </ul>
  );
}
