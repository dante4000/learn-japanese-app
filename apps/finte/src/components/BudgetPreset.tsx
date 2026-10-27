"use client";

import { useRef, useState } from "react";
import { fitBudget, type BudgetBasis } from "@/lib/budget-preset";
import { categoryMeta } from "@/lib/categories";
import { formatMoney, formatMonth } from "@/lib/format";
import type { CategoryBudget } from "@/lib/types";
import { useSavedRefresh } from "./useSavedRefresh";
import { PlanFeedback, PlanField } from "./PlanControls";
import { SectionCard } from "./ui";
import Link from "./AppLink";

export function BudgetPreset({ basis, records, onSaved, disabled }: { basis: BudgetBasis; records: CategoryBudget[]; onSaved: (records: CategoryBudget[]) => void; disabled: boolean }) {
  const [income, setIncome] = useState(basis.preference?.income ?? basis.income);
  const [savings, setSavings] = useState(Math.max(basis.preference?.savings ?? 0, basis.goalReserve));
  const [revision, setRevision] = useState(basis.preference?.revision ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const { savedMessage, refreshAfterSave, clearSavedFeedback } = useSavedRefresh();
  const fit = fitBudget(basis, income, savings);
  const money = (value: number) => formatMoney(value, basis.currency);
  async function apply() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null); clearSavedFeedback();
    try {
      const next = fit.rows.map((row) => {
        const existing = records.find((r) => r.category === row.category && r.currency === basis.currency);
        return { id: existing?.id ?? `preset-${basis.currency}-${row.category}`, revision: existing?.revision ?? 0, currency: basis.currency, category: row.category, limit: row.limit };
      });
      const response = await fetch("/api/planning", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "budgets", action: "save-many", records: next, preference: { currency: basis.currency, revision, income, savings: fit.savings } }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save budgets.");
      onSaved(data.records); setRevision(data.preference.revision); refreshAfterSave();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save budgets."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <SectionCard title="Budget preset for your goals" className="mb-5">
    <p className="mb-3 text-sm text-muted">Based on {basis.months.length ? basis.months.map(formatMonth).join(", ") : "no completed months yet"}. Uses posted income and net spending, including fixed estimates. Review these amounts before applying.</p>
    {basis.missingMonths.length > 0 && <p className="mb-3 text-sm text-coral">Missing activity in {basis.missingMonths.map(formatMonth).join(", ")}. These months are excluded from averages. Linked history may be incomplete.</p>}
    {!basis.goals.length ? <p className="mb-3 text-sm text-muted">No active savings goals yet. Enter a monthly savings reserve below or <Link className="underline" href="/goals">add a goal</Link> to fit the preset to its target date.</p> : <ul className="mb-4 space-y-1 text-sm text-muted">{basis.goals.map((g, i) => <li key={`${g.name}-${i}`}>{g.name}: {money(g.monthly)}/month{!g.dated ? " · no target date" : ""}</li>)}</ul>}
    <form onSubmit={(event) => { event.preventDefault(); void apply(); }}>
      <fieldset disabled={busy || disabled} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <PlanField label={`Monthly take-home income (${basis.currency})`}><input className="plan-input" type="number" inputMode="decimal" min="0.01" max="1000000000" step="0.01" required value={income || ""} onChange={(e) => setIncome(Number(e.target.value))} /></PlanField>
          <PlanField label={`Monthly savings reserve (${basis.currency})`}><input className="plan-input" type="number" inputMode="decimal" min={basis.goalReserve} max="1000000000" step="0.01" required value={savings} onChange={(e) => setSavings(Number(e.target.value))} /></PlanField>
        </div>
        <p className="text-sm text-muted">Savings reserve: {money(fit.savings)} · Loan payment reserve: {money(fit.debtPayments)} · Spending limits: {money(fit.total)} · Unallocated: {money(fit.remaining)}.</p>
        {fit.shortfall > 0 && <p role="status" className="text-sm text-coral">Short by {money(fit.shortfall)}/month before flexible spending. Adjust your goals, income, or essential costs. This preset cannot meet the current targets.</p>}
        <details><summary className="cursor-pointer py-2 text-sm">Review all {fit.rows.length} category limits</summary><ul className="divide-y divide-[var(--color-line)]">{fit.rows.map((r) => <li key={r.category} className="flex justify-between gap-4 py-2 text-sm"><span>{categoryMeta(r.category).label}<span className="block text-xs text-muted">{r.essential ? "Protected essential average" : "Flexible"} · history {money(r.average)}</span></span><span className="tnum">{money(r.limit)}</span></li>)}</ul></details>
        <p className="text-xs text-muted">Essential averages stay fixed. Flexible limits shrink when savings need more room. Zero means no spending planned. Applying replaces this currency’s category limits; it does not change goals or move money. Reapply after changing goals.</p>
        <button type="submit" className="plan-button plan-primary" disabled={!basis.months.length}>{busy ? "Saving budgets…" : fit.shortfall > 0 ? "Save limits with this shortfall" : "Apply all budget limits"}</button>
      </fieldset>
    </form>
    <div className="mt-3"><PlanFeedback error={error} savedMessage={savedMessage} /></div>
  </SectionCard>;
}
