"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ManualEntry } from "@/lib/types";
import { formatMoney } from "@/lib/format";

export function ManualEntries({
  entries,
  currency,
}: {
  entries: ManualEntry[];
  currency: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [kind, setKind] = useState<"asset" | "liability">("asset");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !value) return;
    if (!Number.isFinite(Number(value))) {
      setError("Value must be a number.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, value: Number(value), kind }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Could not add entry");
        return;
      }
      setName("");
      setValue("");
      router.refresh();
    } catch {
      setError("Could not add entry");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/manual?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Could not remove entry");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not remove entry");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {entries.length > 0 && (
        <ul className="mb-4 space-y-2">
          {entries.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-xl border hairline bg-surface px-4 py-2.5"
            >
              <span
                className={`h-2 w-2 rounded-full ${m.kind === "asset" ? "bg-blue" : "bg-coral"}`}
              />
              <span className="text-sm text-cream">{m.name}</span>
              <span
                className={`tnum ml-auto text-sm ${m.kind === "asset" ? "text-blue" : "text-coral"}`}
              >
                {m.kind === "asset" ? "" : "−"}
                {formatMoney(m.value, currency, { cents: false })}
              </span>
              <button
                onClick={() => remove(m.id)}
                disabled={busy}
                className="text-faint hover:text-coral"
                aria-label="Remove"
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

      <form onSubmit={add} className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Home, Car, Cash"
          className="min-w-32 flex-1 rounded-xl border hairline bg-surface px-3 py-2.5 text-sm text-cream outline-none placeholder:text-faint focus:border-blue"
        />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="decimal"
          placeholder="Value"
          className="tnum w-28 rounded-xl border hairline bg-surface px-3 py-2.5 text-sm text-cream outline-none placeholder:text-faint focus:border-blue"
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as "asset" | "liability")}
          className="rounded-xl border hairline bg-surface px-3 py-2.5 text-sm text-cream outline-none focus:border-blue"
        >
          <option value="asset">Asset</option>
          <option value="liability">Liability</option>
        </select>
        <button
          type="submit"
          disabled={busy || !name || !value}
          className="rounded-xl bg-blue px-4 py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
}
