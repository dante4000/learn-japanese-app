import { EmployerHousingSupport } from "./types";
import { incomeSourceLabel } from "./aliases";
import type { IncomeMonth } from "./insights";

export const EMPLOYER_HOUSING_SEGMENT = "Studio rent support";
// A pale indigo keeps the non-cash contribution cool-toned like income while
// reading as distinct from every bank-deposit source color.
const EMPLOYER_HOUSING_COLOR = "#a5b4fc";

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

/** Stack support onto eligible chart months as its own segment; deposit counts stay bank-only. */
export function withEmployerHousingSupport(months: IncomeMonth[], support: EmployerHousingSupport | null | undefined): IncomeMonth[] {
  return months.map((month) => {
    const amount = employerHousingSupportTotal(support, [month.month]);
    if (!amount) return month;
    return {
      ...month,
      total: month.total + amount,
      segments: [...month.segments, { name: EMPLOYER_HOUSING_SEGMENT, total: amount, color: EMPLOYER_HOUSING_COLOR, count: 0 }],
    };
  });
}
