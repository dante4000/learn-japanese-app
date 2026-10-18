import { activeBaselines, isHousingBaseline } from "./analytics";
// Bilt Card 2.0 "Housing-only" rewards: the points you earn on rent/mortgage
// scale by your Everyday Spend Ratio — everyday (non-housing) card spend divided
// by your housing payment — measured per statement cycle. Below 25% you earn a
// flat 250-point floor; at 25/50/75/100% you unlock 0.5/0.75/1.0/1.25x. Spend
// past 100% does not raise the rate (it dilutes it), so the sweet spot is
// everyday spend ≈ housing payment. See docs/superpowers/specs.

import type { Account, AppState, Transaction } from "./types";
import { cardStatus, matchAccountToCard } from "./cards";
import { categoryMeta, resolveCategoryKey, isHousingTransaction } from "./categories";

const RENT_CATEGORY = "RENT_AND_UTILITIES";

/** Catalog key for the Bilt card (see CARD_CATALOG in cards.ts). */
export const BILT_CARD_KEY = "bilt-mastercard";

/** Default statement cycle start day when the user hasn't set one. */
export const DEFAULT_STATEMENT_DAY = 23;

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
  if (!Number.isFinite(housingPayment) || housingPayment <= 0) {
    return { ratio: 0, multiplier: 0, points: 0, maxed: false, nextMultiplier: null, toNext: null };
  }
  const spend = Number.isFinite(everydaySpend) ? Math.max(0, everydaySpend) : 0;
  const ratio = spend / housingPayment;

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
    toNext: next ? Math.max(0, next.at * housingPayment - spend) : null,
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

/** Net eligible purchases in the cycle; refunds reduce qualifying spend. */
export function biltEverydaySpend(
  transactions: Transaction[],
  accountId: string,
  cycle: StatementCycle,
): number {
  let sum = 0;
  for (const t of transactions) {
    if (t.accountId !== accountId) continue;
    if (t.hidden || t.pending) continue;
    const category = resolveCategoryKey(t);
    if (!categoryMeta(category).isSpending || category === "BANK_FEES") continue;
    if (isHousingTransaction(t)) continue;
    const utilityEvidence = /electric|internet|telephone|telecom|water|sewage|cable|\bgas\b|\butility\b|\butilities\b/i.test(
      `${t.name} ${t.merchantName ?? ""} ${(t.categoryDetailed ?? "").replaceAll("_", " ")}`,
    );
    if (category === RENT_CATEGORY && !utilityEvidence) continue;
    if (t.date < cycle.start || t.date > cycle.end) continue;
    sum += t.amount;
  }
  return Math.max(0, Math.round(sum * 100) / 100);
}

/** The connected account matched to the Bilt card, or null. */
export function findBiltAccount(state: AppState): Account | null {
  return state.accounts.find((a) => a.type === "credit" && a.currency === "USD" && matchAccountToCard(a) === BILT_CARD_KEY && cardStatus(state, BILT_CARD_KEY, a) === "active") ?? null;
}

/**
 * The user's monthly rent/housing amount from the RENT_AND_UTILITIES baseline,
 * as of `month` (yyyy-mm). Re-saving a baseline supersedes the earlier entry
 * rather than replacing it in place (see injectBaselines), so the meter has to
 * read the one in force now — taking the first would quote last year's rent.
 * Only named housing bills apply. Future baselines do not apply yet.
 */
export function housingBaseline(state: AppState, month?: string): number | null {
  const active = activeBaselines(state.baselines, month ?? new Date().toISOString().slice(0, 7)).filter((b) => isHousingBaseline(b) && (b.currency ?? "USD") === "USD");
  return active.length === 1 ? active[0].amount : null;
}

export interface BiltMeter {
  account: Account;
  housingPayment: number;
  everydaySpend: number;
  cycle: StatementCycle;
  rewards: HousingRewards;
  statementDay: number;
  /** True when housingPayment came from the user's override (not the baseline). */
  housingFromOverride: boolean;
}

/** Everything the Overview tile needs, or null when no Bilt card is connected. */
export function resolveBiltMeter(state: AppState, today: string): BiltMeter | null {
  const account = findBiltAccount(state);
  if (!account) return null;

  const config = state.biltConfig;
  const statementDay = config?.statementDay ?? DEFAULT_STATEMENT_DAY;
  const housingPayment =
    config?.housingOverride ?? housingBaseline(state, today.slice(0, 7)) ?? 0;
  const cycle = statementCycle(today, statementDay);
  const everydaySpend = biltEverydaySpend(state.transactions, account.id, {
    ...cycle,
    end: today < cycle.end ? today : cycle.end,
  });

  return {
    account,
    housingPayment,
    everydaySpend,
    cycle,
    rewards: biltHousingRewards(everydaySpend, housingPayment),
    statementDay,
    housingFromOverride: config?.housingOverride != null,
  };
}
