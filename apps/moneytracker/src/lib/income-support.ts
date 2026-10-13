import { EmployerHousingSupport } from "./types";
import { incomeSourceLabel } from "./aliases";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Validate one documented employer-paid housing contribution. */
export function parseEmployerHousingSupport(input: unknown): EmployerHousingSupport | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const body = input as Record<string, unknown>;
  if (typeof body.source !== "string" || !body.source.trim()) return null;
  if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) return null;
  if (typeof body.startMonth !== "string" || !MONTH.test(body.startMonth)) return null;
  const endMonth = body.endMonth == null || body.endMonth === "" ? null : body.endMonth;
  if (endMonth !== null && (typeof endMonth !== "string" || !MONTH.test(endMonth) || endMonth < body.startMonth)) return null;
  return { source: incomeSourceLabel(null, body.source), amount: body.amount, startMonth: body.startMonth, endMonth };
}

/** Count eligible calendar months. Never create bank transactions or deposits. */
export function employerHousingSupportTotal(support: EmployerHousingSupport | null | undefined, months: string[]): number {
  if (!support) return 0;
  const eligible = new Set(months.filter((month) => month >= support.startMonth && (!support.endMonth || month <= support.endMonth)));
  return eligible.size * support.amount;
}

/** Global employer support belongs to its exact payer, never a focused bank account. */
export function eligibleEmployerHousingSupport(support: EmployerHousingSupport | null | undefined, selectedSource: string, focusedAccount: boolean): EmployerHousingSupport | null {
  if (!support || focusedAccount) return null;
  if (!selectedSource || selectedSource === "__employer_housing__") return support;
  return incomeSourceLabel(null, selectedSource) === incomeSourceLabel(null, support.source) ? support : null;
}
