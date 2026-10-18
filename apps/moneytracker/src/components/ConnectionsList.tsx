"use client";

import { DetailLink } from "@/components/DetailPanel";

import { useLoadingStatus, useLoadingTransition } from "./LoadingFeedback";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Item } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function ConnectionsList({ items }: { items: Item[] }) {
  const router = useRouter();
  const [, startRefresh] = useLoadingTransition("Updating view…");
  const [busy, setBusy] = useState<string | null>(null);
  useLoadingStatus(Boolean(busy), "Removing connection…");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  async function remove(id: string, name: string) {
    if (!confirm(`Remove ${name}? This deletes its accounts and transactions and revokes access.`))
      return;
    setBusy(id);
    setError(null);
    setWarning(null);
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || `Could not remove ${name}`);
        return;
      }
      if (typeof data?.warning === "string") setWarning(data.warning);
      startRefresh(() => router.refresh());
    } catch {
      setError(`Could not remove ${name}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-3 text-sm text-coral" role="alert">
          {error}
        </p>
      )}
      {warning && <p role="alert" className="mb-3 break-words text-sm text-coral">{warning}</p>}
      {items.length === 0 && <p className="py-6 text-center text-sm text-muted">No connections yet. Connect a bank or import a CSV below.</p>}
      <ul className="space-y-2">
      {items.map((it) => (
        <li
          key={it.id}
          className="flex items-center gap-3 rounded-xl border hairline bg-surface px-4 py-3"
        >
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${
              it.status === "healthy"
                ? "bg-blue"
                : it.status === "needs_reauth"
                  ? "bg-slate"
                  : "bg-coral"
            }`}
          />
          <div className="min-w-0 flex-1 break-words">
            <div className="text-sm text-cream"><DetailLink query={{ metric: "connection", record: it.id, account: "all" }}>{it.institutionName}</DetailLink></div>
            <div className="text-xs text-faint">
              {it.provider === "plaid" ? "Plaid" : "CSV import"}
              {it.lastSyncedAt ? ` · synced ${formatDate(it.lastSyncedAt.slice(0, 10))}` : ""}
              {it.status === "needs_reauth" ? " · needs reconnect — remove and re-link this bank" : ""}
              {it.status === "error" && it.error ? ` · ${it.error}` : ""}
            </div>
          </div>
          <button
            onClick={() => remove(it.id, it.institutionName)}
            disabled={busy === it.id}
            className="min-h-11 lg:min-h-0 ml-auto shrink-0 rounded-lg px-3 py-1.5 text-xs text-faint transition-colors hover:text-coral disabled:opacity-50"
          >
            {busy === it.id ? "Removing…" : "Remove"}
          </button>
        </li>
      ))}
      </ul>
    </div>
  );
}
