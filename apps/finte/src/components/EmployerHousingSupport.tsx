"use client";

import { useLoadingStatus } from "./LoadingFeedback";

import { useState } from "react";
import { useSavedRefresh } from "@/components/useSavedRefresh";
import { EmployerHousingSupport } from "@/lib/types";

/** Edit the confirmed studio contribution without creating deposit records. */
export function EmployerHousingSupportEditor({ support, sources }: { support?: EmployerHousingSupport | null; sources: string[] }) {
  const { savedMessage, clearSavedFeedback, refreshAfterSave } = useSavedRefresh();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState(support?.source ?? sources[0] ?? "");
  const [amount, setAmount] = useState(support ? String(support.amount) : "");
  const [startMonth, setStartMonth] = useState(support?.startMonth ?? "");
  const [endMonth, setEndMonth] = useState(support?.endMonth ?? "");
  const [busy, setBusy] = useState(false);
  useLoadingStatus(busy, "Saving studio support…");
  const [error, setError] = useState("");
  const options = [...new Set([...sources, source])];
  const field = "mt-1 min-h-11 min-w-0 w-full rounded-xl border hairline bg-surface px-3 py-2 text-base text-cream sm:text-sm";
  async function save(event: React.FormEvent) {
    event.preventDefault(); clearSavedFeedback(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/income-support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source, amount: Number(amount), startMonth, endMonth: endMonth || null }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) { setError(data?.error ?? "Could not save employer support."); return; }
      setOpen(false); refreshAfterSave();
    } catch { setError("Could not save employer support."); }
    finally { setBusy(false); }
  }
  async function remove() {
    clearSavedFeedback(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/income-support", { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) { setError(data?.error ?? "Could not remove employer support."); return; }
      setOpen(false); refreshAfterSave();
    } catch { setError("Could not remove employer support."); }
    finally { setBusy(false); }
  }
  return (
    <div className="mt-4">
      <button type="button" disabled={busy} onClick={() => setOpen((value) => !value)} aria-expanded={open} className="min-h-11 rounded-xl border hairline px-3 py-2 text-sm text-blue">{support ? "Edit studio support" : "Configure studio support"}</button>
      {open && <form onSubmit={save} className="mt-3">
        <fieldset disabled={busy} className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <legend className="mb-2 text-sm text-cream">Employer-paid studio rent</legend>
          <label className="text-xs text-muted">Paying source<select value={source} onChange={(event) => setSource(event.target.value)} className={field}>{options.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
          <label className="text-xs text-muted">Monthly contribution<input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className={field} /></label>
          <label className="text-xs text-muted">Start month<input required type="month" value={startMonth} onChange={(event) => setStartMonth(event.target.value)} className={field} /></label>
          <label className="text-xs text-muted">End month (optional, inclusive)<input type="month" min={startMonth || undefined} value={endMonth} onChange={(event) => setEndMonth(event.target.value)} className={field} /></label>
          <p className="text-xs text-muted sm:col-span-2">Enter the confirmed contribution and its start month. Leave the end blank while payments continue. Support stays separate from bank deposits.</p>
          <div className="flex flex-wrap gap-2 sm:col-span-2"><button type="submit" className="min-h-11 rounded-xl bg-blue px-4 py-2 text-sm text-ink">{busy ? "Saving…" : "Save support"}</button><button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-xl px-3 py-2 text-sm text-muted">Cancel</button>{support && <button type="button" onClick={remove} className="min-h-11 rounded-xl px-3 py-2 text-sm text-coral">Remove support</button>}</div>
        </fieldset>
      </form>}
      {savedMessage && <p role="status" className="mt-2 text-sm text-muted">{savedMessage}</p>}
      {error && <p role="alert" className="mt-2 text-sm text-coral">{error}</p>}
    </div>
  );
}
