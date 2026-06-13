import Link from "next/link";
import { loadScopedState } from "@/lib/scoped-state";
import { cashFlowByMonth } from "@/lib/analytics";
import {
  overview,
  incomeSources,
  spendByWeekday,
  largestPurchases,
  categorySpendTrends,
  newMerchants,
  windowMonths,
} from "@/lib/insights";
import { categoryMeta, resolveCategoryKey } from "@/lib/categories";
import { displayPayee } from "@/lib/aliases";
import { formatDate, formatMoney, formatMonth } from "@/lib/format";
import { CashFlowBars } from "@/components/charts/CashFlowBars";
import { WeekdayBars } from "@/components/charts/WeekdayBars";
import { EmptyState, PageHeading, SectionCard, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AnalysisPage() {
  const { state, focus } = await loadScopedState();
  const cur = state.accounts[0]?.currency ?? "USD";
  const subtitle = focus
    ? `${focus.name} · where the money comes from, where it goes, and what's changing.`
    : "Where the money comes from, where it goes, and what's changing.";

  if (state.accounts.length === 0) {
    return (
      <div>
        <PageHeading title="Analysis" subtitle={subtitle} />
        <EmptyState />
      </div>
    );
  }

  const ov = overview(state, 12);
  if (ov.months === 0) {
    return (
      <div>
        <PageHeading title="Analysis" subtitle={subtitle} />
        <SectionCard>
          <p className="py-10 text-center text-sm text-muted">
            No activity recorded yet. Import a CSV or sync a bank to see your
            money analyzed here.
          </p>
        </SectionCard>
      </div>
    );
  }

  // Same available-months window as every other section, so the bar count and
  // totals agree with the hero stats (cashFlowByMonth otherwise emits $0 rows
  // for months that have only transfers/pending activity).
  const windowSet = new Set(windowMonths(state, 12));
  const flows = cashFlowByMonth(state, 1_000_000).filter((f) =>
    windowSet.has(f.month),
  );
  const best = flows.reduce((a, b) => (b.net > a.net ? b : a), flows[0]);
  const worst = flows.reduce((a, b) => (b.net < a.net ? b : a), flows[0]);
  const sources = incomeSources(state, 12);
  const weekdays = spendByWeekday(state, 12);
  const spendCount = weekdays.reduce((a, d) => a + d.count, 0);
  const avgSize = spendCount ? ov.spending / spendCount : 0;
  const biggest = largestPurchases(state, 12, 5);
  const trends = categorySpendTrends(state, 12);
  const fresh = newMerchants(state, 12, 3);
  const monthsLabel = `last ${ov.months} month${ov.months === 1 ? "" : "s"}`;

  return (
    <div>
      <PageHeading title="Analysis" subtitle={subtitle} />

      {/* 1 · Hero stats */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={`Income · ${monthsLabel}`}
          value={formatMoney(ov.income, cur, { cents: false })}
          accent="blue"
        />
        <StatCard
          label={`Spending · ${monthsLabel}`}
          value={formatMoney(ov.spending, cur, { cents: false })}
          accent="coral"
          delay={60}
        />
        <StatCard
          label="Net saved"
          value={formatMoney(ov.net, cur, { cents: false })}
          accent={ov.net >= 0 ? "blue" : "coral"}
          delay={120}
        />
        <StatCard
          label="Savings rate"
          value={
            ov.savingsRate == null
              ? "—"
              : `${Math.round(ov.savingsRate * 100)}%`
          }
          accent={ov.savingsRate == null ? "cream" : ov.savingsRate >= 0 ? "blue" : "coral"}
          delay={180}
          sub="of income kept"
        />
      </div>

      {/* 2 · Cash flow */}
      <SectionCard title="Cash flow, month by month" delay={200}>
        <CashFlowBars data={flows} currency={cur} />
        <div className="mt-2 flex justify-between gap-3">
          {flows.map((f) => (
            <span
              key={f.month}
              className="tnum flex-1 text-center text-[0.62rem] text-muted"
              title={`${formatMonth(f.month)}: saved ${formatMoney(f.net, cur)}`}
            >
              {f.income > 0 ? `${Math.round((f.net / f.income) * 100)}%` : "—"}
            </span>
          ))}
        </div>
        <p className="mt-1 text-center text-[0.62rem] uppercase tracking-wider text-faint">
          saved per month
        </p>
        {flows.length > 0 && (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <div className="flex items-center rounded-xl border hairline bg-surface px-3 py-2.5 text-sm">
              <span className="text-muted">Best month&nbsp;·&nbsp;</span>
              <span className="text-cream">{formatMonth(best.month)}</span>
              <span className="tnum ml-auto text-blue">
                {formatMoney(best.net, cur, { cents: false, sign: true })}
              </span>
            </div>
            <div className="flex items-center rounded-xl border hairline bg-surface px-3 py-2.5 text-sm">
              <span className="text-muted">Toughest month&nbsp;·&nbsp;</span>
              <span className="text-cream">{formatMonth(worst.month)}</span>
              <span className="tnum ml-auto text-coral">
                {formatMoney(worst.net, cur, { cents: false, sign: true })}
              </span>
            </div>
          </div>
        )}
      </SectionCard>

      {/* 3 · Income sources */}
      <SectionCard title="Where money comes from" delay={260} className="mt-4">
        {sources.length ? (
          <div className="space-y-3.5">
            {sources.map((s) => {
              const pct = s.share * 100;
              return (
                <div key={s.name}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate text-cream-dim">{s.name}</span>
                    <span className="shrink-0 text-xs text-faint">
                      · {s.count}× · {s.cadence}
                    </span>
                    <span className="tnum ml-auto shrink-0 text-cream">
                      {formatMoney(s.total, cur, { cents: false })}
                    </span>
                    <span className="tnum w-10 shrink-0 text-right text-muted">
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background:
                          "linear-gradient(90deg, var(--color-blue), var(--color-blue-deep))",
                      }}
                    />
                  </div>
                  <div className="mt-0.5 text-[0.65rem] text-faint">
                    {formatMoney(s.monthlyAvg, cur, { cents: false })}/mo average
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted">
            No income recorded in this window.
          </p>
        )}
      </SectionCard>

      {/* 4 · Behavior patterns */}
      <SectionCard title="How you spend" delay={320} className="mt-4">
        <WeekdayBars data={weekdays} currency={cur} />
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-xl border hairline bg-surface px-3 py-2.5">
            <div className="label-eyebrow">Avg transaction</div>
            <div className="tnum mt-1 text-lg text-cream">
              {formatMoney(avgSize, cur)}
            </div>
          </div>
          <div className="rounded-xl border hairline bg-surface px-3 py-2.5">
            <div className="label-eyebrow">Purchases</div>
            <div className="tnum mt-1 text-lg text-cream">{spendCount}</div>
          </div>
        </div>
        {biggest.length > 0 && (
          <div className="mt-6">
            <h3 className="label-eyebrow mb-3">Biggest single purchases</h3>
            <ul className="space-y-2.5">
              {biggest.map((t) => {
                const meta = categoryMeta(resolveCategoryKey(t));
                return (
                  <li key={t.id} className="flex items-center gap-3 text-sm">
                    <span>{meta.glyph}</span>
                    <div className="min-w-0">
                      <div className="truncate text-cream">
                        {displayPayee(t.merchantName, t.name)}
                      </div>
                      <div className="text-xs text-faint">
                        {formatDate(t.date)} · {meta.label}
                      </div>
                    </div>
                    <span className="tnum ml-auto text-cream">
                      {formatMoney(t.amount, cur)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </SectionCard>

      {/* 5 · Trends — hidden entirely with <4 months of history */}
      {trends.length > 0 && (
        <SectionCard title="What's changing" delay={380} className="mt-4">
          <p className="mb-4 text-xs text-muted">
            Average monthly spend, last 3 months vs the months before.
          </p>
          <div className="space-y-2.5">
            {trends.map((tr) => {
              const up = tr.recentAvg >= tr.priorAvg;
              return (
                <div key={tr.category} className="flex items-center gap-2.5 text-sm">
                  <span>{tr.glyph}</span>
                  <span className="min-w-0 truncate text-cream-dim">{tr.label}</span>
                  <span
                    className={`shrink-0 text-xs ${up ? "text-coral" : "text-blue"}`}
                  >
                    {tr.deltaPct == null
                      ? "new"
                      : `${up ? "▲" : "▼"} ${Math.abs(Math.round(tr.deltaPct))}%`}
                  </span>
                  <span className="tnum ml-auto shrink-0 text-muted">
                    {formatMoney(tr.priorAvg, cur, { cents: false })} →{" "}
                    <span className="text-cream">
                      {formatMoney(tr.recentAvg, cur, { cents: false })}
                    </span>
                    /mo
                  </span>
                </div>
              );
            })}
          </div>
          {fresh.length > 0 && (
            <div className="mt-6">
              <h3 className="label-eyebrow mb-3">New merchants (last 3 months)</h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {fresh.slice(0, 8).map((m) => (
                  <li key={m.name}>
                    <Link
                      href={`/transactions?merchant=${encodeURIComponent(m.name)}`}
                      className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-surface-2"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border hairline bg-surface-2 text-sm text-slate">
                        {m.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm text-cream">{m.name}</div>
                        <div className="text-xs text-faint">
                          {m.count}× since {formatDate(m.firstDate)}
                        </div>
                      </div>
                      <span className="tnum ml-auto text-sm text-cream">
                        {formatMoney(m.total, cur, { cents: false })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
