import type { RecurringFrequency, RecurringStream } from "./types";

const OCCURRENCES_PER_MONTH: Record<RecurringFrequency, number> = {
  WEEKLY: 52 / 12,
  BIWEEKLY: 26 / 12,
  SEMI_MONTHLY: 2,
  MONTHLY: 1,
  ANNUALLY: 1 / 12,
  UNKNOWN: 1,
};

/** Normalize recurring inflows and outflows to the same monthly magnitude. */
export function monthlyEquivalent(
  stream: Pick<RecurringStream, "averageAmount" | "frequency">,
): number {
  return Math.abs(stream.averageAmount) * (OCCURRENCES_PER_MONTH[stream.frequency] ?? 1);
}
