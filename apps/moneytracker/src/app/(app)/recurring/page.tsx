import { loadScopedState } from "@/lib/scoped-state";
import { RecurringStream } from "@/lib/types";
import { categoryMeta } from "@/lib/categories";
import { displayPayee } from "@/lib/aliases";
import { upcomingBills, reimbursedStreams, isTransferStream } from "@/lib/analytics";
import { formatMoney, formatDate } from "@/lib/format";
import { UpcomingBills } from "@/components/UpcomingBills";
import { PeriodToggle } from "@/components/PeriodToggle";
import { BaselineManager } from "@/components/BaselineManager";
import { SectionCard, EmptyState, StatCard, PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

const PER_MONTH: Record<string, number> = {
  WEEKLY: 4.33,
  BIWEEKLY: 2.17,
  SEMI_MONTHLY: 2,
  MONTHLY: 1,
  ANNUALLY: 1 / 12,
  UNKNOWN: 1,
};

function monthlyEquivalent(s: RecurringStream): number {
  return Math.abs(s.averageAmount) * (PER_MONTH[s.frequency] ?? 1);
}

function StreamRow({
  s,
  currency,
  card,
  mult,
  suffix,
  reimbursed,
}: {
  s: RecurringStream;
  currency: string;
  card?: string;
  mult: number;
  suffix: string;
  reimbursed?: number;
}) {
  const meta = categoryMeta(s.categoryPrimary);
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border hairline bg-surface-2">
        {meta.glyph}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm text-cream">
            {displayPayee(s.merchantName, s.description)}
          </span>
          {reimbursed != null && (
            <span
              title={`Offset by a ${formatMoney(reimbursed, currency)} card credit`}
              className="shrink-0 rounded bg-blue/15 px-1.5 py-0.5 text-[0.6rem] text-blue"
            >
              ↩ reimbursed
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-faint">
          <span className="capitalize">
            {s.frequency.toLowerCase().replace("_", " ")}
          </span>
          {card && (
            <>
              <span>·</span>
              <span className="text-slate">{card}</span>
            </>
          )}
          {s.predictedNextDate && (
            <>
              <span>·</span>
              <span>next {formatDate(s.predictedNextDate)}</span>
            </>
          )}
          {!s.isActive && (
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.6rem] text-faint">
              inactive
            </span>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="tnum text-sm text-cream">
          {formatMoney(Math.abs(s.lastAmount), currency)}
        </div>
        <div className="tnum text-[0.65rem] text-faint">
          ≈{formatMoney(monthlyEquivalent(s) * mult, currency, { cents: false })}
          {suffix}
        </div>
      </div>
    </li>
  );
}

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { state } = await loadScopedState();
  const cur = state.accounts[0]?.currency ?? "USD";
  const sp = await searchParams;
  const period = sp.period === "annual" ? "annual" : "monthly";
  const mult = period === "annual" ? 12 : 1;
  const suffix = period === "annual" ? "/yr" : "/mo";

  const cardName = new Map(state.accounts.map((a) => [a.id, a.name]));
  const reimbursed = reimbursedStreams(state);

  // Transfers and card payments get detected by Plaid as recurring streams
  // (often as both an outflow AND inflow) — exclude so they aren't shown as
  // fake subscriptions/income. isTransferStream is the same predicate the
  // bills timeline and spending totals use.
  const subs = state.recurring
    .filter((s) => s.type === "outflow" && !isTransferStream(s))
    .sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a));
  const income = state.recurring
    .filter((s) => s.type === "inflow" && !isTransferStream(s))
    .sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a));

  const monthlySubs = subs
    .filter((s) => s.isActive)
    .reduce((a, s) => a + monthlyEquivalent(s), 0);
  const monthlyIncome = income
    .filter((s) => s.isActive)
    .reduce((a, s) => a + monthlyEquivalent(s), 0);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = upcomingBills(state, today, 45);

  if (state.accounts.length === 0) {
    return (
      <div>
        <PageHeading title="Recurring" subtitle="Subscriptions, bills, and income that repeat." />
        <EmptyState />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <PageHeading
          title="Recurring"
          subtitle="Subscriptions, bills, and income that repeat. Internal transfers are ignored."
        />
        <div className="mt-1 shrink-0">
          <PeriodToggle period={period} />
        </div>
      </div>

      {state.recurring.length === 0 && state.baselines.length === 0 ? (
        <SectionCard>
          <p className="py-10 text-center text-sm text-muted">
            Recurring detection needs ~180 days of Plaid history. It populates as
            more syncs in.
          </p>
        </SectionCard>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-4">
            <StatCard
              label="Subscriptions & bills"
              value={`${formatMoney(monthlySubs * mult, cur, { cents: false })}${suffix}`}
              accent="coral"
              sub={`${formatMoney(monthlySubs * (mult === 1 ? 12 : 1), cur, { cents: false })} ${mult === 1 ? "/ year" : "/ month"}`}
            />
            <StatCard
              label="Recurring income"
              value={`${formatMoney(monthlyIncome * mult, cur, { cents: false })}${suffix}`}
              accent="blue"
              delay={60}
            />
          </div>

          {/* Upcoming bills timeline */}
          <SectionCard
            title="Upcoming bills"
            delay={90}
            className="mb-5"
            action={<span className="text-xs text-muted">next predicted charges</span>}
          >
            <UpcomingBills
              bills={upcoming.bills}
              dueSoonTotal={upcoming.dueSoonTotal}
              currency={cur}
            />
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title={`Subscriptions & bills (${subs.length})`} delay={120}>
              {subs.length ? (
                <ul className="divide-y divide-[var(--color-line)]">
                  {subs.map((s) => (
                    <StreamRow
                      key={s.id}
                      s={s}
                      currency={cur}
                      card={cardName.get(s.accountId)}
                      mult={mult}
                      suffix={suffix}
                      reimbursed={reimbursed.get(s.id)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted">None detected.</p>
              )}
            </SectionCard>

            <SectionCard title={`Income streams (${income.length})`} delay={160}>
              {income.length ? (
                <ul className="divide-y divide-[var(--color-line)]">
                  {income.map((s) => (
                    <StreamRow
                      key={s.id}
                      s={s}
                      currency={cur}
                      card={cardName.get(s.accountId)}
                      mult={mult}
                      suffix={suffix}
                    />
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted">None detected.</p>
              )}
            </SectionCard>
          </div>

          {/* Fixed monthly baselines (rent + parking, etc.) */}
          <SectionCard
            title="Fixed monthly baselines"
            delay={200}
            className="mt-4"
            action={
              <span className="text-xs text-muted">
                fills months the bank feed misses
              </span>
            }
          >
            <p className="mb-4 -mt-2 text-xs text-muted">
              For bills the bank feed doesn’t reliably capture (e.g. rent paid
              through a card with short history). Months that already have a real
              charge aren’t double-counted.
            </p>
            <BaselineManager baselines={state.baselines} currency={cur} />
          </SectionCard>
        </>
      )}
    </div>
  );
}
