import Link from "next/link";
import { loadScopedState } from "@/lib/scoped-state";
import {
  summarize,
  spendingByCategory,
  cashFlowDetail,
  topMerchants,
  currentMonthKey,
  isSyntheticBaseline,
  LIABILITY_TYPES,
} from "@/lib/analytics";
import { categoryMeta, resolveCategoryKey } from "@/lib/categories";
import { displayPayee } from "@/lib/aliases";
import { formatMoney, formatMonth, formatDate } from "@/lib/format";
import { Donut } from "@/components/charts/Donut";
import { CashFlowDetail } from "@/components/CashFlowDetail";
import { NetWorthArea } from "@/components/charts/NetWorthArea";
import { StatCard, SectionCard, EmptyState, PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const { state, focus } = await loadScopedState();

  if (state.accounts.length === 0) {
    return (
      <div>
        <PageHeading title="Overview" subtitle="Everything you own and owe, at a glance." />
        <EmptyState />
      </div>
    );
  }

  const s = summarize(state);
  const month = currentMonthKey(state);
  const cur = s.netWorth.currency;
  const categories = spendingByCategory(state, month);
  const cashflow = cashFlowDetail(state, 6);
  const merchants = topMerchants(state, month, 20);
  const recent = state.transactions
    .filter((t) => !t.pending && !isSyntheticBaseline(t))
    .slice(0, 6);
  const acctName = new Map(state.accounts.map((a) => [a.id, a.name]));

  return (
    <div>
      <PageHeading
        title="Overview"
        subtitle={
          focus
            ? `${focus.name} · ${formatMonth(month)}.`
            : `Figures for ${formatMonth(month)}.`
        }
      />

      {/* Hero: net worth (all accounts) or account balance (focused) */}
      <section
        className="card rise relative overflow-hidden p-6 md:p-8"
        style={{ animationDelay: "0ms" }}
      >
        {focus ? (
          <div>
            <div className="label-eyebrow">
              {state.items[0]?.institutionName ?? "Account"} ·{" "}
              {focus.subtype || focus.type}
              {focus.mask ? ` ···· ${focus.mask}` : ""}
            </div>
            <div className="tnum mt-2 font-display text-5xl tracking-tight text-cream md:text-6xl">
              {formatMoney(focus.balances.current ?? 0, cur, { cents: false })}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {LIABILITY_TYPES.has(focus.type) && (
                <span className="text-coral">
                  balance <span className="text-muted">owed</span>
                </span>
              )}
              {focus.balances.available != null && (
                <span className="text-blue">
                  {formatMoney(focus.balances.available, cur, { cents: false })}{" "}
                  <span className="text-muted">available</span>
                </span>
              )}
              {focus.balances.limit != null && (
                <span className="text-cream-dim">
                  {formatMoney(focus.balances.limit, cur, { cents: false })}{" "}
                  <span className="text-muted">limit</span>
                </span>
              )}
            </div>
            <p className="mt-4 text-xs text-muted">
              Viewing one account — switch to “All accounts” for net worth.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="label-eyebrow">Net worth</div>
                <div className="tnum mt-2 font-display text-5xl tracking-tight text-cream md:text-6xl">
                  {formatMoney(s.netWorth.netWorth, cur, { cents: false })}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span className="text-blue">
                    {formatMoney(s.netWorth.totalAssets, cur, { cents: false })}{" "}
                    <span className="text-muted">assets</span>
                  </span>
                  <span className="text-coral">
                    {formatMoney(s.netWorth.totalLiabilities, cur, { cents: false })}{" "}
                    <span className="text-muted">owed</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <NetWorthArea snapshots={state.snapshots} currency={cur} />
            </div>
          </>
        )}
      </section>

      {/* Stat row */}
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Spent this month"
          value={formatMoney(s.monthSpending, cur, { cents: false })}
          accent="coral"
          delay={60}
          sub={
            s.spendingDeltaPct != null ? (
              <span className={s.spendingDeltaPct <= 0 ? "text-blue" : "text-coral"}>
                {s.spendingDeltaPct <= 0 ? "▼" : "▲"}{" "}
                {Math.abs(Math.round(s.spendingDeltaPct))}% vs last month
              </span>
            ) : (
              "—"
            )
          }
        />
        <StatCard
          label="Income this month"
          value={formatMoney(s.monthIncome, cur, { cents: false })}
          accent="blue"
          delay={120}
        />
        <StatCard
          label="Net cash flow"
          value={formatMoney(s.monthNet, cur, { sign: true, cents: false })}
          accent={s.monthNet >= 0 ? "blue" : "coral"}
          delay={180}
          sub="Income minus spending"
        />
      </div>

      {/* Spending breakdown */}
      <SectionCard title="Where it went" delay={220} className="mt-5">
        {categories.length ? (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Donut
              slices={categories.map((c) => ({
                label: c.label,
                value: c.total,
                color: c.color,
                key: c.category,
              }))}
              total={s.monthSpending}
              currency={cur}
              hrefBase="/transactions"
              month={month}
            />
            <ul className="grid flex-1 gap-x-8 gap-y-2 self-stretch sm:grid-cols-2">
              {categories.slice(0, 8).map((c) => (
                <li key={c.category} className="flex items-center gap-3 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: c.color }}
                  />
                  <span className="text-cream-dim">{c.label}</span>
                  <span className="tnum ml-auto text-cream">
                    {formatMoney(c.total, cur, { cents: false })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted">
            No spending recorded this month.
          </p>
        )}
      </SectionCard>

      {/* Detailed cash flow */}
      <SectionCard
        title="Cash flow"
        delay={260}
        className="mt-5"
        action={
          <span className="text-xs text-muted">
            income vs spending · last {cashflow.rows.length} months
          </span>
        }
      >
        <CashFlowDetail summary={cashflow} currency={cur} />
      </SectionCard>

      {/* Merchants + recent */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Top merchants" delay={300}>
          {merchants.length ? (
            <ul className="space-y-3">
              {merchants.map((m) => (
                <li key={m.name}>
                  <Link
                    href={`/transactions?merchant=${encodeURIComponent(m.name)}`}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-surface-2"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg border hairline bg-surface-2 text-sm text-slate-soft">
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm text-cream">{m.name}</div>
                      <div className="text-xs text-faint">{m.count}×</div>
                    </div>
                    <span className="tnum ml-auto text-sm text-cream">
                      {formatMoney(m.total, cur, { cents: false })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted">No merchants yet.</p>
          )}
        </SectionCard>

        <SectionCard
          title="Recent activity"
          delay={340}
          action={
            <Link href="/transactions" className="text-xs text-blue hover:underline">
              View all →
            </Link>
          }
        >
          <ul className="divide-y divide-[var(--color-line)]">
            {recent.map((t) => {
              const meta = categoryMeta(resolveCategoryKey(t));
              return (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border hairline bg-surface-2">
                    {meta.glyph}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm text-cream">
                      {displayPayee(t.merchantName, t.name, acctName.get(t.accountId))}
                    </div>
                    <div className="text-xs text-faint">{formatDate(t.date)}</div>
                  </div>
                  <span
                    className={`tnum ml-auto text-sm ${t.amount < 0 ? "text-blue" : "text-cream"}`}
                  >
                    {formatMoney(-t.amount, cur, { sign: true })}
                  </span>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
