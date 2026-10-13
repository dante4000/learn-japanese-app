"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecurringBaseline } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { formatMoney, formatMonth } from "@/lib/format";

// Manage fixed monthly baselines (e.g. rent + parking) the bank feed misses.
export function BaselineManager({
  baselines,
  currency = "USD",
}: {
  baselines: RecurringBaseline[];
  currency?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("RENT_AND_UTILITIES");
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError("Enter a name and a positive amount.");
      return;
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(startMonth)) {
      setError("Start month must be yyyy-mm.");
      return;
    }
    if (endMonth && (!/^\d{4}-(0[1-9]|1[0-2])$/.test(endMonth) || endMonth < startMonth)) {
      setError("End month must be on or after start month.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/baseline", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, name, amount: Number(amount), category, startMonth, endMonth: endMonth || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Could not save baseline.");
        return;
      }
      setOpen(false);
      setName("");
      setAmount("");
      setStartMonth("");
      setEndMonth("");
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Could not save baseline.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/baseline?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Could not remove baseline.");
        return;
      }
      if (editingId === id) { setOpen(false); setEditingId(null); }
      router.refresh();
    } catch {
      setError("Could not remove baseline.");
    } finally {
      setBusy(false);
    }
  }

  function edit(entry: RecurringBaseline) {
    setEditingId(entry.id);
    setName(entry.name);
    setAmount(String(entry.amount));
    setCategory(entry.category);
    setStartMonth(entry.startMonth);
    setEndMonth(entry.endMonth ?? "");
    setError(null);
    setOpen(true);
  }
  function startNew() {
    setEditingId(null);
    setName(""); setAmount(""); setCategory("RENT_AND_UTILITIES");
    setStartMonth(""); setEndMonth(""); setError(null); setOpen(true);
  }

  const field =
    "mt-1 min-h-11 w-full min-w-0 max-w-full rounded-xl border hairline bg-surface px-3 py-2.5 text-base sm:text-sm text-cream outline-none placeholder:text-faint focus:border-blue";

  return (
    <div>
      {baselines.length > 0 && (
        <ul className="mb-3 space-y-2">
          {baselines.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border hairline bg-surface px-4 py-2.5 text-sm"
            >
              <span className="min-w-0 break-words text-cream">{b.name}</span>
              <span className="text-xs text-faint">
                {formatMonth(b.startMonth)} – {b.endMonth ? formatMonth(b.endMonth) : "ongoing"}
              </span>
              <span className="tnum ml-auto shrink-0 text-cream">
                {formatMoney(b.amount, currency, { cents: false })}/mo
              </span>
              <button type="button" onClick={() => edit(b)} disabled={busy} className="min-h-11 rounded-lg px-3 py-2 text-xs text-blue" aria-label={`Edit ${b.name}`}>Edit</button>
              <button
                onClick={() => remove(b.id)}
                disabled={busy}
                className="min-h-11 min-w-11 lg:min-h-0 lg:min-w-0 text-faint hover:text-coral"
                aria-label={`Remove ${b.name}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <form onSubmit={add}>
          <fieldset disabled={busy} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <legend className="mb-2 text-sm text-cream">{editingId ? "Edit fixed monthly bill" : "Add fixed monthly bill"}</legend>
            <label className="text-xs text-muted">Bill name
              <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Rent & Parking" className={field} />
            </label>
            <label className="text-xs text-muted">Monthly amount
              <input required value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="Amount/mo" className={`${field} tnum`} />
            </label>
            <label className="text-xs text-muted">Category
              <select value={category} onChange={(event) => setCategory(event.target.value)} className={field}>
                {Object.values(CATEGORIES).filter((entry) => entry.isSpending).map((entry) => <option key={entry.key} value={entry.key}>{entry.label}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted">Start month
              <input required type="month" value={startMonth} onChange={(event) => setStartMonth(event.target.value)} className={`${field} tnum`} />
            </label>
            <label className="text-xs text-muted">End month (optional, inclusive)
              <input type="month" min={startMonth || undefined} value={endMonth} onChange={(event) => setEndMonth(event.target.value)} className={`${field} tnum`} />
            </label>
            <p className="self-end pb-2 text-xs text-muted">Leave the end month blank for an ongoing bill. Estimates stop after the end month.</p>
            <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
              <button type="submit" disabled={busy || !name.trim() || !amount || !startMonth} className="min-h-11 rounded-xl bg-blue px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40">{busy ? "Saving…" : editingId ? "Save changes" : "Add baseline"}</button>
              <button type="button" onClick={() => { setOpen(false); setError(null); }} className="min-h-11 rounded-xl px-3 py-2 text-sm text-faint">Cancel</button>
            </div>
          </fieldset>
        </form>
      ) : (
        <button
          onClick={startNew}
          className="min-h-11 lg:min-h-0 rounded-xl border border-dashed hairline px-4 py-2.5 text-sm text-cream-dim transition-colors hover:border-line-2"
        >
          + Add a fixed monthly bill (fills months the bank feed misses)
        </button>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-coral">{error}</p>}
    </div>
  );
}
