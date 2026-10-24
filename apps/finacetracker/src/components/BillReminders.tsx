"use client";

import { useState } from "react";
import type { BillReminder } from "@/lib/types";
import { nextBillDate } from "@/lib/planning";
import { monthlyEquivalent } from "@/lib/recurring";
import { formatDate, formatMoney } from "@/lib/format";
import { DeletePlan, PlanFeedback, PlanField, usePlanRecords } from "./PlanControls";

const FREQUENCIES = { WEEKLY: "Weekly", BIWEEKLY: "Every two weeks", MONTHLY: "Monthly", ANNUALLY: "Yearly" };
export function BillReminders({ reminders, currency, today }: { reminders: BillReminder[]; currency: string; today: string }) {
  const plans = usePlanRecords("billReminders", reminders);
  const [draft, setDraft] = useState<BillReminder | null>(null);
  const money = (amount: number) => formatMoney(amount, currency);
  const records = plans.records.filter((b) => b.currency === currency).sort((a, b) => Number(a.status === "cancelled") - Number(b.status === "cancelled") || nextBillDate(a, today).localeCompare(nextBillDate(b, today)));
  const active = records.filter((b) => b.status === "active");
  const monthly = active.reduce((sum, b) => sum + monthlyEquivalent({ averageAmount: b.amount, frequency: b.frequency }), 0);
  function create() { setDraft({ id: crypto.randomUUID(), revision: 0, currency, name: "", amount: 0, frequency: "MONTHLY", dueDate: today, status: "active", note: "" }); }
  return <div>
    <p className="mb-4 text-sm leading-relaxed text-muted">Track bills that are missing from your bank feed. These reminders do not add spending or change the detected totals above. Dates roll forward automatically; they do not confirm payment.</p>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted"><span className="tnum text-cream">{money(monthly)}/mo</span> · {money(monthly * 12)}/year · {active.length} active reminders</p><button className="plan-button plan-primary" disabled={plans.busy} onClick={create}>+ Add bill</button></div>
    <PlanFeedback {...plans} />
    {draft && <form key={draft.id} className="mb-5 rounded-xl border hairline bg-surface-2 p-4" onSubmit={async (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); if (await plans.save({ ...draft, name: String(data.get("name")), amount: Number(data.get("amount")), frequency: String(data.get("frequency")) as BillReminder["frequency"], dueDate: String(data.get("date")), note: String(data.get("note")), status: String(data.get("status")) as BillReminder["status"] })) setDraft(null); }}>
      <h3 className="mb-4 font-semibold">{draft.revision ? "Edit bill reminder" : "New bill reminder"}</h3>
      <fieldset disabled={plans.busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <PlanField label="Bill or subscription"><input autoFocus className="plan-input" name="name" required maxLength={100} defaultValue={draft.name} placeholder="Internet, streaming, insurance…" /></PlanField>
        <PlanField label={`Amount per bill (${currency})`}><input className="plan-input" name="amount" type="number" inputMode="decimal" min="0.01" max="1000000000" step="0.01" required defaultValue={draft.amount || ""} /></PlanField>
        <PlanField label="Repeat"><select className="plan-input" name="frequency" defaultValue={draft.frequency}>{Object.entries(FREQUENCIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></PlanField>
        <PlanField label="Due date"><input className="plan-input" name="date" type="date" min="2000-01-01" max="2200-12-31" required defaultValue={draft.dueDate} /></PlanField>
        <PlanField label="Tracking status"><select className="plan-input" name="status" defaultValue={draft.status}><option value="active">Active</option><option value="cancelled">Cancelled with provider</option></select></PlanField>
        <PlanField label="Notes (optional)"><input className="plan-input" name="note" maxLength={500} defaultValue={draft.note} placeholder="Renewal terms or cancellation reference" /></PlanField>
        <div className="flex flex-wrap gap-2"><button type="submit" className="plan-button plan-primary">{plans.busy ? "Saving…" : "Save bill"}</button><button type="button" className="plan-button" onClick={() => setDraft(null)}>Cancel</button></div>
      </fieldset>
      <p className="mt-3 text-xs text-muted">Cancel with the provider first. Changing the tracking status does not cancel a service.</p>
    </form>}
    {!records.length && !draft && <p className="py-5 text-sm text-muted">No manual reminders yet. Add a bill to see its next due date here.</p>}
    <ul className="divide-y divide-[var(--color-line)]">{records.map((bill) => {
      const next = nextBillDate(bill, today);
      const days = Math.round((Date.parse(next) - Date.parse(today)) / 86400000);
      return <li key={bill.id} className="py-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words font-medium text-cream">{bill.name}</h3><p className="mt-1 text-xs text-muted">{FREQUENCIES[bill.frequency]} · {bill.status === "cancelled" ? "Cancelled with provider" : `Next ${formatDate(next)}`}</p></div><span className="tnum text-cream">{money(bill.amount)}</span></div>
        {bill.status === "active" && days <= 7 && <p className="mt-2 text-xs text-coral">{days === 0 ? "Due today" : `Due in ${days} day${days === 1 ? "" : "s"}`}</p>}
        {bill.note && <p className="mt-2 break-words text-sm text-muted">{bill.note}</p>}
        <div className="mt-3 flex flex-wrap gap-2"><button className="plan-button" disabled={plans.busy} onClick={() => setDraft(bill)}>Edit<span className="sr-only"> {bill.name}</span></button><DeletePlan name={bill.name} disabled={plans.busy} onDelete={() => plans.remove(bill)} /></div>
      </li>;
    })}</ul>
  </div>;
}
