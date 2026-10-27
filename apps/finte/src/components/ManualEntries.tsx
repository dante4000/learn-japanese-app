"use client";

import { useLoadingStatus } from "./LoadingFeedback";

import { useRef, useState } from "react";
import { useSavedRefresh } from "./useSavedRefresh";
import { ManualEntry } from "@/lib/types";
import { formatMoney } from "@/lib/format";

export function ManualEntries({
  entries,
  currency,
}: {
  entries: ManualEntry[];
  currency: string;
}) {
  const { savedMessage, refreshAfterSave, clearSavedFeedback } = useSavedRefresh();
  const requestId = useRef<{ id: string; body: string } | null>(null);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [kind, setKind] = useState<"asset" | "liability">("asset");
  const [busy, setBusy] = useState(false);
  useLoadingStatus(busy, "Saving entry…");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !value) return;
    if (!Number.isFinite(Number(value))) {
      setError("Value must be a number.");
      return;
    }
    clearSavedFeedback();
    const fingerprint = JSON.stringify({ name, value, kind, currency });
    if (requestId.current?.body !== fingerprint) requestId.current = { id: crypto.randomUUID(), body: fingerprint };
    setBusy(true);
    setError(null);
    setWarning(null);
    try {
      const res = await fetch("/api/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, value: Number(value), kind, currency, requestId: requestId.current!.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Could not add entry");
        return;
      }
      requestId.current = null;
      setName("");
      setValue("");
      if (typeof data?.warning === "string") setWarning(data.warning);
      refreshAfterSave();
    } catch {
      setError("Could not add entry");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    clearSavedFeedback();
    setBusy(true);
    setError(null);
    setWarning(null);
    try {
      const res = await fetch(`/api/manual?id=${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Could not remove entry");
        return;
      }
      if (typeof data?.warning === "string") setWarning(data.warning);
      refreshAfterSave();
    } catch {
      setError("Could not remove entry");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {savedMessage && <p role="status" className="mb-3 text-sm text-muted">{savedMessage}</p>}
      {entries.length > 0 && (
        <ul className="mb-4 space-y-2">
          {entries.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border hairline bg-surface px-4 py-2.5"
            >
              <span
                className={`h-2 w-2 rounded-full ${m.kind === "asset" ? "bg-blue" : "bg-coral"}`}
              />
              <span className="min-w-0 break-words text-sm text-cream">{m.name}</span>
              <span
                className={`tnum ml-auto text-sm ${m.kind === "asset" ? "text-blue" : "text-coral"}`}
              >
                {m.kind === "asset" ? "" : "−"}
                {formatMoney(m.value, currency, { cents: false })}
              </span>
              <button
                onClick={() => remove(m.id)}
                disabled={busy}
                className="min-h-11 min-w-11 lg:min-h-0 lg:min-w-0 text-faint hover:text-coral"
                aria-label={`Remove ${m.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mb-3 text-sm text-coral" role="alert">
          {error}
        </p>
      )}

      {warning && <p role="status" className="mb-3 text-sm text-muted">{warning}</p>}

      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input
          aria-label="Entry name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Home, Car, Cash"
          className="min-w-0 w-full flex-auto sm:min-w-32 sm:flex-1 rounded-xl border hairline bg-surface px-3 py-2.5 text-base sm:text-sm text-cream outline-none placeholder:text-faint focus:border-blue"
        />
        <input
          aria-label="Entry value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="decimal"
          placeholder="Value"
          className="tnum min-w-0 w-full sm:w-28 rounded-xl border hairline bg-surface px-3 py-2.5 text-base sm:text-sm text-cream outline-none placeholder:text-faint focus:border-blue"
        />
        <select
          aria-label="Entry type"
          value={kind}
          onChange={(e) => setKind(e.target.value as "asset" | "liability")}
          className="min-w-0 max-w-full rounded-xl border hairline bg-surface px-3 py-2.5 text-base sm:text-sm text-cream outline-none focus:border-blue"
        >
          <option value="asset">Asset</option>
          <option value="liability">Liability</option>
        </select>
        <button
          type="submit"
          disabled={busy || !name || !value}
          className="min-h-11 lg:min-h-0 rounded-xl bg-blue px-4 py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
}
