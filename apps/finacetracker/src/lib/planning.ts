import { CATEGORIES } from "./categories";
import type { BillReminder, CategoryBudget, MetaDoc, SavingsGoal } from "./types";

export type PlanKind = "goals" | "budgets" | "billReminders";
export type PlanRecord = SavingsGoal | CategoryBudget | BillReminder;
export const PLAN_KINDS: PlanKind[] = ["goals", "budgets", "billReminders"];

export class PlanError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
const fail = (message: string): never => { throw new PlanError(message); };
export function validPlanDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
    && value >= "2000-01-01" && value <= "2200-12-31";
}
function amount(value: unknown, label: string, positive = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1e9 || (positive && value === 0)) fail(`${label} must be ${positive ? "greater than zero" : "zero or more"} and at most 1 billion.`);
  return Math.round((value as number) * 100) / 100;
}
function name(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 100) fail("Enter a name of 1–100 characters.");
  return (value as string).trim();
}

/** Whitelist fields before they enter encrypted metadata or a restored backup. */
export function validatePlan(kind: PlanKind, value: unknown): PlanRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("Invalid plan.");
  const v = value as Record<string, unknown>;
  if (typeof v.id !== "string" || !/^[\w-]{1,80}$/.test(v.id)) fail("Invalid plan ID.");
  if (!Number.isSafeInteger(v.revision) || (v.revision as number) < 0) fail("Invalid revision.");
  if (typeof v.currency !== "string" || !/^[A-Z]{3}$/.test(v.currency)) fail("Invalid currency.");
  try { new Intl.NumberFormat("en", { style: "currency", currency: v.currency as string }); } catch { fail("Invalid currency."); }
  const base = { id: v.id as string, revision: v.revision as number, currency: v.currency as string };
  if (kind === "goals") {
    if (v.targetDate !== null && !validPlanDate(v.targetDate)) fail("Enter a valid target date.");
    const target = amount(v.target, "Target", true);
    if (!target) fail("Target must be at least 0.01.");
    return { ...base, name: name(v.name), target, saved: amount(v.saved, "Saved amount"), targetDate: v.targetDate as string | null, monthlyContribution: amount(v.monthlyContribution, "Monthly contribution") };
  }
  if (kind === "budgets") {
    if (typeof v.category !== "string" || !Object.hasOwn(CATEGORIES, v.category) || !CATEGORIES[v.category].isSpending) fail("Choose a spending category.");
    const limit = amount(v.limit, "Budget", true);
    if (!limit) fail("Budget must be at least 0.01.");
    return { ...base, category: v.category as string, limit };
  }
  if (!["WEEKLY", "BIWEEKLY", "MONTHLY", "ANNUALLY"].includes(v.frequency as string)) fail("Choose a repeat frequency.");
  if (!validPlanDate(v.dueDate)) fail("Enter a valid bill date.");
  if (!["active", "cancelled"].includes(v.status as string)) fail("Invalid bill status.");
  if (typeof v.note !== "string" || v.note.length > 500) fail("Notes must be 500 characters or fewer.");
  const billAmount = amount(v.amount, "Bill amount", true);
  if (!billAmount) fail("Bill amount must be at least 0.01.");
  return { ...base, name: name(v.name), amount: billAmount, frequency: v.frequency as BillReminder["frequency"], dueDate: v.dueDate as string, status: v.status as BillReminder["status"], note: (v.note as string).trim() };
}

/** Record revisions protect edits made in another tab; store revisions protect writes. */
export function savePlan(meta: MetaDoc, kind: PlanKind, raw: unknown): PlanRecord {
  const record = validatePlan(kind, raw);
  const records: PlanRecord[] = meta[kind] ?? [];
  const prior = records.find((r) => r.id === record.id);
  if (prior && prior.revision === record.revision + 1 && JSON.stringify({ ...prior, revision: record.revision }) === JSON.stringify(record)) return prior;
  if (prior ? prior.revision !== record.revision : record.revision !== 0) throw new PlanError("This plan changed. Reload the page before editing again.", 409);
  if (kind === "budgets" && records.some((r) => r.id !== record.id && r.currency === record.currency && "category" in r && r.category === (record as CategoryBudget).category)) throw new PlanError("A budget already exists for this category and currency.", 409);
  if (!prior && records.length >= 500) fail("You can save up to 500 records of each type.");
  const saved = { ...record, revision: record.revision + 1 };
  Object.assign(meta, { [kind]: [...records.filter((r) => r.id !== saved.id), saved] });
  return saved;
}

export function goalProgress(goal: SavingsGoal, today: string) {
  const remaining = Math.max(0, Math.round((goal.target - goal.saved) * 100) / 100);
  const days = goal.targetDate ? Math.ceil((Date.parse(goal.targetDate) - Date.parse(today)) / 86400000) : null;
  const months = days === null ? null : Math.max(1, Math.ceil(days / (365.25 / 12)));
  const needed = months === null ? null : Math.ceil(remaining / months * 100) / 100;
  const status = remaining === 0 ? "Complete" : days !== null && days < 0 ? "Past target date" : needed !== null && goal.monthlyContribution < needed ? "Increase monthly savings" : goal.monthlyContribution > 0 ? "On plan" : "Set a monthly plan";
  return { remaining, percent: Math.min(100, goal.saved / goal.target * 100), needed, status };
}

/** Keep the original day when advancing a date such as January 31. */
export function nextBillDate(bill: BillReminder, today: string): string {
  if (bill.dueDate >= today) return bill.dueDate;
  const start = new Date(`${bill.dueDate}T00:00:00Z`);
  const end = new Date(`${today}T00:00:00Z`);
  if (bill.frequency === "WEEKLY" || bill.frequency === "BIWEEKLY") {
    const step = (bill.frequency === "WEEKLY" ? 7 : 14) * 86400000;
    return new Date(start.getTime() + Math.ceil((end.getTime() - start.getTime()) / step) * step).toISOString().slice(0, 10);
  }
  const step = bill.frequency === "ANNUALLY" ? 12 : 1;
  let offset = Math.max(0, Math.floor(((end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth()) / step) * step);
  for (;;) {
    const last = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + offset + 1, 0));
    const result = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), Math.min(start.getUTCDate(), last.getUTCDate()))).toISOString().slice(0, 10);
    if (result >= today) return result;
    offset += step;
  }
}
