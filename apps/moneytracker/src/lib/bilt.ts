// Bilt Card 2.0 "Housing-only" rewards: the points you earn on rent/mortgage
// scale by your Everyday Spend Ratio — everyday (non-housing) card spend divided
// by your housing payment — measured per statement cycle. Below 25% you earn a
// flat 250-point floor; at 25/50/75/100% you unlock 0.5/0.75/1.0/1.25x. Spend
// past 100% does not raise the rate (it dilutes it), so the sweet spot is
// everyday spend ≈ housing payment. See docs/superpowers/specs.

import type { Transaction } from "./types";

const RENT_CATEGORY = "RENT_AND_UTILITIES";

/** Ratio thresholds → rent multiplier, ascending. */
const TIERS: { at: number; multiplier: number }[] = [
  { at: 0.25, multiplier: 0.5 },
  { at: 0.5, multiplier: 0.75 },
  { at: 0.75, multiplier: 1.0 },
  { at: 1.0, multiplier: 1.25 },
];

/** Flat points earned on the housing payment when below the first tier. */
export const FLOOR_POINTS = 250;

export interface HousingRewards {
  /** everydaySpend / housingPayment (0 when housing payment is 0). */
  ratio: number;
  /** Current rent multiplier: 0 (floor) | 0.5 | 0.75 | 1.0 | 1.25. */
  multiplier: number;
  /** Estimated points on this housing payment. */
  points: number;
  /** True once ratio ≥ 1 — extra everyday spend only dilutes the rate. */
  maxed: boolean;
  /** Multiplier of the next tier, or null when maxed. */
  nextMultiplier: number | null;
  /** Everyday dollars still needed to reach nextMultiplier, or null when maxed. */
  toNext: number | null;
}

export function biltHousingRewards(
  everydaySpend: number,
  housingPayment: number,
): HousingRewards {
  const ratio = housingPayment > 0 ? everydaySpend / housingPayment : 0;

  let multiplier = 0;
  for (const t of TIERS) if (ratio >= t.at) multiplier = t.multiplier;

  const next = TIERS.find((t) => ratio < t.at) ?? null;
  const maxed = ratio >= 1;

  return {
    ratio,
    multiplier,
    points: multiplier === 0 ? FLOOR_POINTS : Math.round(housingPayment * multiplier),
    maxed,
    nextMultiplier: next ? next.multiplier : null,
    toNext: next ? Math.max(0, next.at * housingPayment - everydaySpend) : null,
  };
}

export interface StatementCycle {
  /** ISO yyyy-mm-dd, inclusive. */
  start: string;
  /** ISO yyyy-mm-dd, inclusive (day before the next cycle's start). */
  end: string;
  /** Human label, e.g. "Jun 23 – Jul 22". */
  label: string;
}

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function shortLabel(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** The statement cycle containing `today` for a card that starts each cycle on
 *  `startDay` (1–28). Start is the most recent startDay on/before today; end is
 *  the day before the following startDay. */
export function statementCycle(today: string, startDay: number): StatementCycle {
  const [y, m, d] = today.split("-").map(Number);
  // Anchor to this month's startDay, or last month's if we're before it.
  const anchorMonth = d >= startDay ? m - 1 : m - 2; // 0-indexed
  const start = new Date(Date.UTC(y, anchorMonth, startDay));
  const nextStart = new Date(Date.UTC(y, anchorMonth + 1, startDay));
  const end = new Date(nextStart.getTime() - 86_400_000);
  return {
    start: iso(start),
    end: iso(end),
    label: `${shortLabel(start)} – ${shortLabel(end)}`,
  };
}

function effectiveCategory(t: Transaction): string {
  return t.userCategory ?? t.categoryPrimary;
}

/** Sum of everyday (non-rent) outflows posted to `accountId` within `cycle`. */
export function biltEverydaySpend(
  transactions: Transaction[],
  accountId: string,
  cycle: StatementCycle,
): number {
  let sum = 0;
  for (const t of transactions) {
    if (t.accountId !== accountId) continue;
    if (t.hidden || t.pending) continue;
    if (t.amount <= 0) continue; // outflows only
    if (effectiveCategory(t) === RENT_CATEGORY) continue;
    if (t.date < cycle.start || t.date > cycle.end) continue;
    sum += t.amount;
  }
  return sum;
}
