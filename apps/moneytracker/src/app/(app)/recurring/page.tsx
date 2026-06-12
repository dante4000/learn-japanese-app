import { loadScopedState } from "@/lib/scoped-state";
import { RecurringStream } from "@/lib/types";
import { categoryMeta } from "@/lib/categories";
import { upcomingBills } from "@/lib/analytics";
import { formatMoney, formatDate } from "@/lib/format";
import { UpcomingBills } from "@/components/UpcomingBills";
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

function StreamRow({ s, currency }: { s: RecurringStream; currency: string }) {
  const meta = categoryMeta(s.categoryPrimary);
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border hairline bg-surface-2">
        {meta.glyph}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-cream">
          {s.merchantName || s.description}
        </div>
        <div className="flex items-center gap-2 text-xs text-faint">
          <span className="capitalize">{s.frequency.toLowerCase().replace("_", " ")}</span>
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
          ≈{formatMoney(monthlyEquivalent(s), currency, { cents: false })}/mo
        </div>
      </div>
    </li>
  );
}

export default async function RecurringPage() {
  const { state } = await loadScopedState();
  const cur = state.accounts[0]?.currency ?? "USD";

  // Internal transfers between your own accounts (e.g. checking → savings) get
  // detected by Plaid as both a recurring outflow AND a recurring inflow, which
  // double-counts as a fake subscription and fake income. Exclude them.
  const isInternalTransfer = (s: RecurringStream) =>
    s.categoryPrimary === "TRANSFER_IN" || s.categoryPrimary === "TRANSFER_OUT";

  const subs = state.recurring
    .filter((s) => s.type === "outflow" && !isInternalTransfer(s))
    .sort((a, b) => monthlyEquivalent(b) - monthlyEquivalent(a));
  const income = state.recurring
    .filter((s) => s.type === "inflow" && !isInternalTransfer(s))
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
        <PageHeading title="Recurring" subtitle="Subscriptions, bills, and income that repeat. Transfers between your own accounts are ignored." />
        <EmptyState />
      </div>
    );
  }

  return (
    <div>
      <PageHeading title="Recurring" subtitle="Subscriptions, bills, and income that repeat. Transfers between your own accounts are ignored." />

      {state.recurring.length === 0 ? (
        <SectionCard>
          <p className="py-10 text-center text-sm text-muted">
            Recurring detection needs ~180 days of Plaid history. Sync a bank
            with Plaid and it will populate here. (CSV imports don’t include
            recurring detection yet.)
          </p>
        </SectionCard>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-4">
            <StatCard
              label="Subscriptions & bills"
              value={`${formatMoney(monthlySubs, cur, { cents: false })}/mo`}
              accent="coral"
              sub={`${formatMoney(monthlySubs * 12, cur, { cents: false })} / year`}
            />
            <StatCard
              label="Recurring income"
              value={`${formatMoney(monthlyIncome, cur, { cents: false })}/mo`}
              accent="blue"
              delay={60}
            />
          </div>

          {/* Upcoming bills timeline */}
          <SectionCard
            title="Upcoming bills"
            delay={90}
            className="mb-5"
            action={
              <span className="text-xs text-muted">next predicted charges</span>
            }
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
                    <StreamRow key={s.id} s={s} currency={cur} />
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
                    <StreamRow key={s.id} s={s} currency={cur} />
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-muted">None detected.</p>
              )}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
