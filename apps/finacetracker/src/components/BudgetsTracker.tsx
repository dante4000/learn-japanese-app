"use client";

import { useState } from "react";
import Link from "@/components/AppLink";
import type { CategoryBudget } from "@/lib/types";
import type { CategorySpend } from "@/lib/analytics";
import { CATEGORIES, categoryMeta } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import { SectionCard, StatCard } from "./ui";
import { DeletePlan, PlanFeedback, PlanField, PlanProgress, usePlanRecords } from "./PlanControls";

export function BudgetsTracker({ budgets, spending, currency, month }: { budgets: CategoryBudget[]; spending: CategorySpend[]; currency: string; month: string }) {
  const plans = usePlanRecords("budgets", budgets);
  const [draft, setDraft] = useState<CategoryBudget | null>(null);
  const records = plans.records.filter((b) => b.currency === currency);
  const money = (value: number) => formatMoney(value, currency);
  const spent = (category: string) => spending.find((s) => s.category === category)?.total ?? 0;
  const limit = records.reduce((sum, b) => sum + b.limit, 0);
  const used = records.reduce((sum, b) => sum + spent(b.category), 0);
  const unbudgeted = spending.filter((s) => !records.some((b) => b.category === s.category));
  const available = Object.values(CATEGORIES).filter((c) => c.isSpending && !records.some((b) => b.category === c.key));
  function create(category = available[0]?.key) { if (category) setDraft({ id: crypto.randomUUID(), revision: 0, category, currency, limit: 0 }); }
  return <div>
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatCard label="Monthly budget" value={money(limit)} sub={`${records.length} categories planned`} /><StatCard label="Spent in budgeted categories" value={money(used)} sub="Net of refunds; includes fixed estimates" /><StatCard label={used > limit ? "Over budget" : "Left in budget"} value={money(Math.abs(limit - used))} accent={used > limit ? "coral" : "blue"} sub="Based on recorded activity" /></div>
    <PlanFeedback {...plans} />
    {!draft && <button className="plan-button plan-primary mb-5" disabled={plans.busy || !available.length} onClick={() => create()}>+ Add category budget</button>}
    {draft && <SectionCard title={draft.revision ? "Edit monthly budget" : "New monthly budget"} className="mb-5"><form key={draft.id} onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); if (await plans.save({ ...draft, category: String(data.get("category")), limit: Number(data.get("limit")) })) setDraft(null); }}><fieldset disabled={plans.busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
      <PlanField label="Category"><select className="plan-input" name="category" defaultValue={draft.category}>{Object.values(CATEGORIES).filter((c) => c.isSpending && (c.key === draft.category || !records.some((b) => b.category === c.key))).map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</select></PlanField>
      <PlanField label={`Monthly limit (${currency})`}><input autoFocus className="plan-input" type="number" inputMode="decimal" name="limit" min="0.01" max="1000000000" step="0.01" required defaultValue={draft.limit || ""} /></PlanField>
      <div className="flex flex-wrap gap-2"><button className="plan-button plan-primary" type="submit">{plans.busy ? "Saving…" : "Save budget"}</button><button type="button" className="plan-button" onClick={() => setDraft(null)}>Cancel</button></div>
    </fieldset></form></SectionCard>}
    {!records.length && !draft && <SectionCard title="Make room for what matters" className="mb-4"><p className="text-sm text-muted">Add a monthly limit for food, shopping, or any spending category. Your bank and CSV activity update progress automatically.</p></SectionCard>}
    <div className="grid gap-4 md:grid-cols-2">{records.map((budget) => {
      const total = spent(budget.category); const over = total > budget.limit;
      return <SectionCard key={budget.id} title={categoryMeta(budget.category).label} action={<span className={`text-xs ${over ? "text-coral" : "text-blue"}`}>{over ? "Over budget" : total >= budget.limit * 0.8 ? "Near limit" : "Within budget"}</span>}>
        <p className="tnum break-words text-2xl text-cream">{money(total)} <span className="text-sm text-muted">/ {money(budget.limit)}</span></p>
        <PlanProgress value={total / budget.limit * 100} label={`${categoryMeta(budget.category).label} budget used`} warning={over} />
        <p className={`text-sm ${over ? "text-coral" : "text-muted"}`}>{money(Math.abs(budget.limit - total))} {over ? "over the limit" : "remaining"}</p>
        <div className="mt-4 flex flex-wrap gap-2"><Link className="plan-button" href={`/details?metric=spending&category=${budget.category}&months=${month}&account=all&currency=${currency}`}>View spending</Link><button className="plan-button" disabled={plans.busy} onClick={() => setDraft(budget)}>Edit<span className="sr-only"> {categoryMeta(budget.category).label}</span></button><DeletePlan name={categoryMeta(budget.category).label} disabled={plans.busy} onDelete={() => plans.remove(budget)} /></div>
      </SectionCard>;
    })}</div>
    {unbudgeted.length > 0 && <SectionCard title="Spending without a budget" className="mt-5"><ul className="divide-y divide-[var(--color-line)]">{unbudgeted.map((row) => <li key={row.category} className="flex flex-wrap items-center gap-3 py-3"><span className="min-w-0 flex-1 text-sm text-cream">{row.label}</span><span className="tnum text-sm">{money(row.total)}</span><button className="plan-button" disabled={plans.busy} onClick={() => create(row.category)}>Set limit<span className="sr-only"> for {row.label}</span></button></li>)}</ul></SectionCard>}
    <p className="mt-5 text-xs leading-relaxed text-muted">Limits repeat each month. Changes apply to every month you view. Pending, hidden, and transfer transactions are excluded. Refunds reduce spending. Missing bank data can understate spending.</p>
  </div>;
}
