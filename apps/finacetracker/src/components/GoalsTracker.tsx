"use client";

import { useState } from "react";
import type { SavingsGoal } from "@/lib/types";
import { goalProgress } from "@/lib/planning";
import { formatDate, formatMoney } from "@/lib/format";
import { SectionCard, StatCard } from "./ui";
import { DeletePlan, PlanFeedback, PlanField, PlanProgress, usePlanRecords } from "./PlanControls";

export function GoalsTracker({ goals, currency, today }: { goals: SavingsGoal[]; currency: string; today: string }) {
  const plans = usePlanRecords("goals", goals);
  const [draft, setDraft] = useState<SavingsGoal | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const money = (value: number) => formatMoney(value, currency);
  const records = plans.records.filter((g) => g.currency === currency);
  const saved = records.reduce((sum, g) => sum + g.saved, 0);
  const complete = records.filter((g) => g.saved >= g.target).length;
  const monthly = records.filter((g) => g.saved < g.target).reduce((sum, g) => sum + g.monthlyContribution, 0);
  function create() { setAdding(null); setDraft({ id: crypto.randomUUID(), revision: 0, name: "", currency, target: 0, saved: 0, targetDate: null, monthlyContribution: 0 }); }
  return <div>
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <StatCard label="Saved toward goals" value={money(saved)} accent="blue" sub={`${records.length} goals · ${complete} complete`} />
      <StatCard label="Monthly savings plan" value={money(monthly)} sub="Your planned contributions" />
      <div className="card flex flex-col justify-center gap-2 p-5"><p className="text-sm text-muted">Give your next milestone a plan.</p><button className="plan-button plan-primary" onClick={create} disabled={plans.busy}>+ New goal</button></div>
    </div>
    <PlanFeedback {...plans} />
    {draft && <SectionCard title={draft.revision ? "Edit goal" : "New savings goal"} className="mb-5">
      <form onSubmit={async (event) => {
        event.preventDefault(); const data = new FormData(event.currentTarget);
        if (await plans.save({ ...draft, name: String(data.get("name")), target: Number(data.get("target")), saved: Number(data.get("saved")), monthlyContribution: Number(data.get("monthly")), targetDate: String(data.get("date")) || null })) setDraft(null);
      }} key={draft.id}>
        <fieldset disabled={plans.busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
          <PlanField label="Goal name"><input className="plan-input" name="name" autoFocus required maxLength={100} defaultValue={draft.name} placeholder="Emergency fund, trip, down payment…" /></PlanField>
          <PlanField label={`Target amount (${currency})`}><input className="plan-input" name="target" type="number" inputMode="decimal" min="0.01" max="1000000000" step="0.01" required defaultValue={draft.target || ""} /></PlanField>
          <PlanField label={`Already saved (${currency})`}><input className="plan-input" name="saved" type="number" inputMode="decimal" min="0" max="1000000000" step="0.01" required defaultValue={draft.saved} /></PlanField>
          <PlanField label={`Monthly contribution (${currency})`}><input className="plan-input" name="monthly" type="number" inputMode="decimal" min="0" max="1000000000" step="0.01" required defaultValue={draft.monthlyContribution} /></PlanField>
          <PlanField label="Target date (optional)"><input className="plan-input" name="date" type="date" min="2000-01-01" max="2200-12-31" defaultValue={draft.targetDate ?? ""} /></PlanField>
          <div className="flex items-end gap-2"><button className="plan-button plan-primary" type="submit">{plans.busy ? "Saving…" : "Save goal"}</button><button className="plan-button" type="button" onClick={() => setDraft(null)}>Cancel</button></div>
        </fieldset>
      </form>
    </SectionCard>}
    {!records.length && !draft && <SectionCard title="What are you saving for?"><p className="mb-4 max-w-lg text-sm text-muted">Set a target, record what you have saved, and track your progress. Start with an emergency fund or your next big purchase.</p><button className="plan-button plan-primary" onClick={create}>Create your first goal</button></SectionCard>}
    <div className="grid items-start gap-4 md:grid-cols-2">
      {records.map((goal) => {
        const progress = goalProgress(goal, today);
        return <SectionCard key={goal.id} title={goal.name} action={<span className={`text-xs ${progress.status === "Increase monthly savings" || progress.status === "Past target date" ? "text-coral" : "text-blue"}`}>{progress.status}</span>}>
          <p className="tnum break-words text-3xl text-cream">{money(goal.saved)}</p>
          <p className="mt-1 text-sm text-muted">of {money(goal.target)} · {Math.round(progress.percent)}%</p>
          <PlanProgress value={progress.percent} label={`${goal.name} progress`} />
          <dl className="grid grid-cols-2 gap-4 text-sm"><div><dt className="text-muted">Remaining</dt><dd className="tnum mt-1 break-words text-cream">{money(progress.remaining)}</dd></div><div><dt className="text-muted">Monthly plan</dt><dd className="tnum mt-1 break-words text-cream">{money(goal.monthlyContribution)}</dd></div></dl>
          {goal.targetDate && <p className="mt-4 text-sm text-muted">Target: {formatDate(goal.targetDate)}{progress.remaining > 0 && progress.status !== "Past target date" ? ` · Save ${money(progress.needed ?? 0)}/month to reach it.` : ""}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {progress.remaining > 0 && <button className="plan-button plan-primary" disabled={plans.busy} onClick={() => { setDraft(null); setAdding(adding === goal.id ? null : goal.id); }}>Record savings</button>}
            <button className="plan-button" disabled={plans.busy} onClick={() => { setAdding(null); setDraft(goal); }}>Edit<span className="sr-only"> {goal.name}</span></button>
            <DeletePlan name={goal.name} disabled={plans.busy} onDelete={() => plans.remove(goal)} />
          </div>
          {adding === goal.id && <form className="mt-4 border-t hairline pt-4" onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); if (await plans.save({ ...goal, saved: Math.round((goal.saved + Number(data.get("amount"))) * 100) / 100 })) setAdding(null); }}>
            <PlanField label={`Add to saved amount (${currency})`}><input autoFocus className="plan-input" type="number" name="amount" inputMode="decimal" min="0.01" max="1000000000" step="0.01" required disabled={plans.busy} /></PlanField>
            <div className="mt-3 flex gap-2"><button type="submit" className="plan-button plan-primary" disabled={plans.busy}>Save amount</button><button type="button" className="plan-button" disabled={plans.busy} onClick={() => setAdding(null)}>Cancel</button></div>
          </form>}
        </SectionCard>;
      })}
    </div>
    <p className="mt-5 text-xs leading-relaxed text-muted">Goals track amounts you record. They do not transfer money or increase net worth. Monthly contributions are a plan, not scheduled transfers. Avoid counting the same savings in more than one goal.</p>
  </div>;
}
