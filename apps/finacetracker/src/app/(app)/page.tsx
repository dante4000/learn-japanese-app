import { BalanceCoverage } from "@/components/BalanceCoverage";
import { detailHref } from "@/lib/details";
import { DetailLink } from "@/components/DetailPanel";
import { CashFlowTrends } from "@/components/CashFlowTrends";
import Link from "@/components/AppLink";
import { EstimatedBillsNotice } from "@/components/EstimatedBillsNotice";
import { loadScopedState } from "@/lib/scoped-state";
import {
  summarize,
  spendingByCategory,
  cashFlowDetail,
  topMerchants,
  currentMonthKey,
  isSyntheticBaseline,
  netWorthHistory,
  todayKey,
  LIABILITY_TYPES,
} from "@/lib/analytics";
import { categoryMeta, resolveCategoryKey } from "@/lib/categories";
import { displayPayee } from "@/lib/aliases";
import { formatMoney, formatMonth, formatDate } from "@/lib/format";
import { resolveBiltMeter } from "@/lib/bilt";
import { BiltRentMeter } from "@/components/BiltRentMeter";
import { Donut } from "@/components/charts/Donut";
import { CashFlowDetail } from "@/components/CashFlowDetail";
import { NetWorthArea } from "@/components/charts/NetWorthArea";
import { StatCard, SectionCard, EmptyState, PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const { state, fullState, focus } = await loadScopedState();

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
  const history = netWorthHistory(state, todayKey());
  const cur = s.netWorth.currency;
  const categories = spendingByCategory(state, month);
  const cashflow = cashFlowDetail(state, 6);
  const merchants = topMerchants(state, month, 20);
  const recent = state.transactions
    .filter((t) => !t.pending && !isSyntheticBaseline(t))
    .slice(0, 6);
  const acctName = new Map(state.accounts.map((a) => [a.id, a.name]));

  const biltCandidate = resolveBiltMeter(fullState, todayKey());
  const bilt = !focus || focus.id === biltCandidate?.account.id ? biltCandidate : null;

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

      <BalanceCoverage state={state} />
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
            <div className="tnum mt-2 break-words font-display text-4xl sm:text-5xl tracking-tight text-cream md:text-6xl">
              <DetailLink query={{ metric: "account", account: focus.id }}>{focus.balances.current == null || focus.availability === "unavailable" ? "Balance unavailable" : formatMoney(focus.balances.current, cur, { cents: false })}</DetailLink>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {focus.balances.current != null && focus.availability !== "unavailable" && LIABILITY_TYPES.has(focus.type) && (
                <span className="text-coral">
                  balance <span className="text-muted">owed</span>
                </span>
              )}
              {focus.balances.available != null && (
                <span className="text-blue">
                  <DetailLink query={{ metric: "account", account: focus.id }}>{formatMoney(focus.balances.available, cur, { cents: false })}</DetailLink>{" "}
                  <span className="text-muted">available</span>
                </span>
              )}
              {focus.balances.limit != null && (
                <span className="text-cream-dim">
                  <DetailLink query={{ metric: "account", account: focus.id }}>{formatMoney(focus.balances.limit, cur, { cents: false })}</DetailLink>{" "}
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
                <div className="tnum mt-2 break-words font-display text-4xl sm:text-5xl tracking-tight text-cream md:text-6xl">
                  <DetailLink query={{ metric: "networth", account: "all" }}>{formatMoney(s.netWorth.netWorth, cur, { cents: false })}</DetailLink>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span className="text-blue">
                    <DetailLink query={{ metric: "networth", account: "all" }}>{formatMoney(s.netWorth.totalAssets, cur, { cents: false })}</DetailLink>{" "}
                    <span className="text-muted">assets</span>
                  </span>
                  <span className="text-coral">
                    <DetailLink query={{ metric: "networth", account: "all" }}>{formatMoney(s.netWorth.totalLiabilities, cur, { cents: false })}</DetailLink>{" "}
                    <span className="text-muted">owed</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <NetWorthArea snapshots={history} currency={cur} />
              <p className="mt-3 text-xs text-muted">Historical balances are reconstructed from transactions. Saved balance snapshots take priority where available.</p>
            </div>
          </>
        )}
      </section>

      <EstimatedBillsNotice state={state} months={[month]} currency={cur} />

      {/* Stat row */}
      <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <StatCard
          label="Spent this month"
          href={detailHref({ metric: "spending", months: [month] })}
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
          href={detailHref({ metric: "income", months: [month] })}
          value={formatMoney(s.monthIncome, cur, { cents: false })}
          accent="blue"
          delay={120}
        />
        <StatCard
          label="Net cash flow"
          href={detailHref({ metric: "net", months: [month] })}
          value={formatMoney(s.monthNet, cur, { sign: true, cents: false })}
          accent={s.monthNet >= 0 ? "blue" : "coral"}
          delay={180}
          sub="Income minus spending"
        />
      </div>

      {/* Bilt rent multiplier meter */}
      {bilt && (
        <BiltRentMeter
          delay={200}
          meter={{
            housingPayment: bilt.housingPayment,
            everydaySpend: bilt.everydaySpend,
            statementDay: bilt.statementDay,
            housingFromOverride: bilt.housingFromOverride,
            cycleLabel: bilt.cycle.label,
            currency: cur,
            rewards: bilt.rewards,
          }}
        />
      )}

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
              hrefBase="/spending/category"
              month={month}
            />
            <ul className="grid flex-1 gap-x-8 gap-y-2 self-stretch sm:grid-cols-2">
              {categories.slice(0, 8).map((c) => (
                <li key={c.category} className="flex items-center gap-3 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: c.color }}
                  />
                  <span className="text-cream-dim"><DetailLink query={{ metric: "spending", category: c.category, months: [month] }}>{c.label}</DetailLink></span>
                  <span className="tnum ml-auto shrink-0 text-cream">
                    <DetailLink query={{ metric: "spending", category: c.category, months: [month], statistic: "share" }}>{formatMoney(c.total, cur, { cents: false })}</DetailLink>
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

      <CashFlowTrends rows={cashflow.rows} currency={cur} />

      {/* Merchants + recent */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Top merchants" delay={300}>
          {merchants.length ? (
            <ul className="space-y-3">
              {merchants.map((m) => (
                <li key={m.name}>
                  <Link
                    href={detailHref({ metric: "spending", merchant: m.name, months: [month] })}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-surface-2"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg border hairline bg-surface-2 text-sm text-slate-soft">
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-cream">{m.name}</div>
                      <div className="text-xs text-faint">{m.count}×</div>
                    </div>
                    <span className="tnum ml-auto shrink-0 text-sm text-cream">
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
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-cream">
                      {displayPayee(t.merchantName, t.name, acctName.get(t.accountId))}
                    </div>
                    <div className="text-xs text-faint">{formatDate(t.date)}</div>
                  </div>
                  <span
                    className={`tnum ml-auto shrink-0 text-sm ${t.amount < 0 ? "text-blue" : "text-cream"}`}
                  >
                    <DetailLink query={{ metric: "transaction", record: t.id, account: t.accountId }}>{formatMoney(-t.amount, cur, { sign: true })}</DetailLink>
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
