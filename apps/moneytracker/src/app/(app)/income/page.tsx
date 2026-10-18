import { detailHref } from "@/lib/details";
import { DetailLink } from "@/components/DetailPanel";
import { DataTable } from "@/components/DataTable";
import { categoryMeta, nonIncomeDepositReason } from "@/lib/categories";
import { isIncome, isSpend, effectiveCategory } from "@/lib/analytics";
import { loadScopedState } from "@/lib/scoped-state";
import {
  incomeBreakdown,
  mergeIncomeMonths,
  largestDepositsForMonths,
  filterBySource,
} from "@/lib/insights";
import { MonthComposition, todayKey } from "@/lib/analytics";
import { incomeSourceLabel } from "@/lib/aliases";
import { formatMoney, formatMonth, formatDate } from "@/lib/format";
import { Donut } from "@/components/charts/Donut";
import { CompositionBars } from "@/components/charts/CompositionBars";
import { MonthPicker } from "@/components/MonthPicker";
import { IncomeScope, Scope } from "@/components/IncomeScope";
import { SourcePicker } from "@/components/SourceToggle";
import { EmployerHousingSupportEditor } from "@/components/EmployerHousingSupport";
import { SupportToggle } from "@/components/SupportToggle";
import { eligibleEmployerHousingSupport, employerHousingSupportTotal, withEmployerHousingSupport } from "@/lib/income-support";
import { SectionCard, EmptyState, StatCard, PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

function calendarMonths(end: string, count: number): string[] {
  const endIndex = Number(end.slice(0, 4)) * 12 + Number(end.slice(5, 7)) - 1;
  return Array.from({ length: count }, (_, i) => {
    const index = endIndex - count + i + 1;
    return `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, "0")}`;
  });
}

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    scope?: string;
    src?: string;
    support?: string;
    [key: string]: string | undefined;
  }>;
}) {
  const { state: fullState, focus: acct } = await loadScopedState();
  const cur = fullState.accounts[0]?.currency ?? "USD";
  const sp = await searchParams;

  const allIncome = incomeBreakdown(fullState);
  const support = fullState.employerHousingSupport;
  const sources = [...new Set([...allIncome.legend.map((source) => source.name), ...(support && !acct ? [support.source] : [])])];
  const supportOnly = Boolean(support && !acct && sp.src === "__employer_housing__");
  const requestedSource = sp.src ? incomeSourceLabel(null, sp.src) : "";
  const selectedSource = sources.includes(requestedSource) ? requestedSource : "";
  const state = supportOnly ? { ...fullState, transactions: [] } : selectedSource ? filterBySource(fullState, selectedSource) : fullState;
  const postedMonths = [...new Set(fullState.transactions.filter((t) => !t.hidden && !t.pending).map((t) => t.date.slice(0, 7)))].sort();
  const latestPosted = postedMonths[postedMonths.length - 1];
  const earliestPosted = postedMonths[0];
  const monthCount = latestPosted && earliestPosted
    ? (Number(latestPosted.slice(0, 4)) - Number(earliestPosted.slice(0, 4))) * 12 + Number(latestPosted.slice(5, 7)) - Number(earliestPosted.slice(5, 7)) + 1
    : 0;
  const months = latestPosted ? calendarMonths(latestPosted, monthCount)
    : support && !acct ? calendarMonths(todayKey().slice(0, 7), 12) : [];
  const visibleSupport = eligibleEmployerHousingSupport(support, supportOnly ? "__employer_housing__" : selectedSource, Boolean(acct));

  if (months.length === 0) {
    return (
      <div>
        <PageHeading
          title="Income"
          subtitle="Income from your bank records. Transfers, refunds, and other payouts stay separate."
        />
        {state.accounts.length === 0 ? (
          <EmptyState />
        ) : (
          <SectionCard>
            <p className="py-10 text-center text-sm text-muted">
              No income recorded yet. Import a CSV or sync a bank to see where
              your money comes from.
            </p>
          </SectionCard>
        )}
      </div>
    );
  }

  const scope: Scope =
    sp.scope === "all" ? "all" : sp.scope === "ytd" ? "ytd" : sp.scope === "year" ? "year" : "month";

  const { byMonth } = incomeBreakdown(state);
  const byMonthMap = new Map(byMonth.map((m) => [m.month, m]));
  const latest = months[months.length - 1];
  const selected =
    scope === "month" && sp.month && months.includes(sp.month)
      ? sp.month
      : latest;

  const chartMonths = months;
  const recordedChart = chartMonths.map((month) => byMonthMap.get(month) ?? { month, total: 0, segments: [] });
  const supportInChart = Boolean(visibleSupport && sp.support === "include");
  const chart = supportInChart ? withEmployerHousingSupport(recordedChart, visibleSupport) : recordedChart;

  // Resolve the active scope into a set of months + the period to compare with.
  let scopeMonths: string[];
  let priorMonths: string[];
  let scopeLabel: string;
  let priorLabel: string;
  if (scope === "all") {
    scopeMonths = months;
    priorMonths = [];
    scopeLabel = "all available history";
    priorLabel = "prior period (unavailable)";
  } else if (scope === "ytd") {
    const year = latest.slice(0, 4);
    const prevYear = String(Number(year) - 1);
    scopeMonths = calendarMonths(latest, Number(latest.slice(5, 7)));
    priorMonths = scopeMonths.map((m) => prevYear + m.slice(4));
    scopeLabel = `YTD ${year}`;
    priorLabel = `YTD ${prevYear}`;
  } else if (scope === "year") {
    scopeMonths = calendarMonths(latest, 12);
    priorMonths = calendarMonths(scopeMonths[0], 13).slice(0, 12);
    scopeLabel = "last 12 mo";
    priorLabel = "prior 12 mo";
  } else {
    scopeMonths = [selected];
    priorMonths = calendarMonths(selected, 2).slice(0, 1);
    scopeLabel = formatMonth(selected);
    priorLabel = priorMonths.length ? formatMonth(priorMonths[0]) : "prev";
  }

  const focus = mergeIncomeMonths(
    scopeMonths.map((m) => byMonthMap.get(m)!).filter(Boolean),
  );
  const nScope = scopeMonths.length || 1;
  const monthlyAvg = focus.total / nScope;
  const deposits = focus.segments.reduce((a, s) => a + s.count, 0);
  const priorTotal = priorMonths.some((month) => allIncome.months.includes(month))
    ? priorMonths.reduce((a, m) => a + (byMonthMap.get(m)?.total ?? 0), 0)
    : null;
  const delta =
    priorTotal && priorTotal > 0
      ? ((focus.total - priorTotal) / priorTotal) * 100
      : null;
  const topSeg = focus.segments[0] ?? null;
  const topShare =
    focus.total > 0 && topSeg ? (topSeg.total / focus.total) * 100 : null;

  const supportTotal = employerHousingSupportTotal(visibleSupport, scopeMonths);
  const bigDeposits = largestDepositsForMonths(state, scopeMonths, 6);
  const excluded = state.transactions.filter((t) => !t.hidden && !t.pending && t.amount < 0 && !isIncome(t) && !isSpend(t) && scopeMonths.includes(t.date.slice(0, 7))).sort((a, b) => b.date.localeCompare(a.date));
  const excludedTotal = excluded.reduce((sum, t) => sum - t.amount, 0);

  // Reuse the stacked CompositionBars by mapping income segments into its shape.
  const comp: MonthComposition[] = chart.map((m) => ({
    month: m.month,
    total: m.total,
    segments: m.segments.map((s) => ({
      category: s.name,
      label: s.name,
      color: s.color,
      glyph: "",
      total: s.total,
      count: s.count,
    })),
  }));
  const legend = mergeIncomeMonths(chart).segments;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <PageHeading
          title="Income"
          subtitle={
            supportOnly
              ? "Studio rent paid by your employer. Separate from bank deposits."
              : selectedSource
              ? `${selectedSource} · recorded deposits, month by month.`
              : acct
                ? `${acct.name} · where your money comes from, month by month.`
                : "Income from your bank records. Transfers, refunds, and other payouts stay separate."
          }
        />
        <div className="mb-1 flex max-w-full flex-wrap items-center gap-2">
          <SourcePicker sources={sources} selected={supportOnly ? "__employer_housing__" : selectedSource} hasSupport={Boolean(support && !acct)} />
          <IncomeScope scope={scope} />
          {scope === "month" && (
            <MonthPicker months={months} selected={selected} />
          )}
        </div>
      </div>

      {!supportOnly && (<>
      {/* Stat row — scope-aware */}
      <div className="mb-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Recorded income · ${scopeLabel}`}
          href={detailHref({ metric: "income", months: scopeMonths, source: selectedSource || undefined })}
          value={formatMoney(focus.total, cur, { cents: false })}
          accent="blue"
          sub={`${deposits} deposit${deposits === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Average / month"
          href={detailHref({ metric: "income", months: scopeMonths, source: selectedSource || undefined, statistic: "monthly" })}
          value={formatMoney(monthlyAvg, cur, { cents: false })}
          accent="cream"
          delay={60}
          sub={`across ${nScope} month${nScope === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Top source"
          href={detailHref({ metric: "income", months: scopeMonths, source: topSeg?.name, denominatorSource: selectedSource || undefined, statistic: "share" })}
          value={topShare == null ? "—" : `${Math.round(topShare)}%`}
          accent="cream"
          delay={120}
          sub={
            topSeg ? (
              <span className="block break-words">{topSeg.name}</span>
            ) : (
              "—"
            )
          }
        />
        <StatCard
          label={scope === "all" ? "History coverage" : `vs ${priorLabel}`}
          href={detailHref({ metric: "income", months: scopeMonths, source: selectedSource || undefined, priorMonths })}
          value={
            scope === "all" ? `${formatMonth(months[0])} – ${formatMonth(latest)}` : delta == null
              ? "—"
              : `${delta >= 0 ? "+" : "−"}${Math.abs(Math.round(delta))}%`
          }
          accent={delta == null ? "cream" : delta >= 0 ? "blue" : "coral"}
          delay={180}
          sub={
            priorTotal != null
              ? formatMoney(priorTotal, cur, { cents: false })
              : "no prior data"
          }
        />
      </div>

      </>)}

      {!supportOnly && <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted">Income excludes tax refunds, Shopify transfers, ticket and sports payouts, and refunds or reimbursements. New CSV deposits with no income evidence appear under Other deposits. You can change a category in Activity.</p>}

      {!acct && (visibleSupport || !support && !selectedSource) && (
        <SectionCard title="Employer-paid support · studio rent" className="mb-5">
          {support ? <>
            <p className="text-sm text-muted">{support.source} pays {formatMoney(support.amount, cur, { cents: false })}/month toward studio rent. This does not enter your bank ledger.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              <div><div className="label-eyebrow">Support · {scopeLabel}</div><p className="tnum mt-1 text-xl text-slate"><DetailLink query={{ metric: "support", months: scopeMonths }}>{formatMoney(supportTotal, cur, { cents: false })}</DetailLink></p></div>
              {!supportOnly && <div><div className="label-eyebrow">Income + employer support</div><p className="tnum mt-1 text-xl text-blue"><DetailLink query={{ metric: "income", months: scopeMonths, source: selectedSource || undefined, support: "include" }}>{formatMoney(focus.total + supportTotal, cur, { cents: false })}</DetailLink></p></div>}
            </div>
            {support.startMonth === "2021-10" && <p className="mt-2 text-xs text-muted">The October 2021 start is approximate, based on support starting five years ago.</p>}
            <p className="mt-2 text-xs text-muted">Effective {formatMonth(support.startMonth)}{support.endMonth ? ` through ${formatMonth(support.endMonth)}` : ", ongoing"}. Support is not counted as a deposit. Charts and recorded-income totals show bank income only.</p>
          </> : <p className="text-sm text-muted">Save employer-paid studio rent to show it separately from recorded deposits.</p>}
          <EmployerHousingSupportEditor key={JSON.stringify(support)} support={support} sources={sources} />
        </SectionCard>
      )}

      {!supportOnly && (<>
      {/* Income by month — the overview. Click a bar to focus that month. */}
      <SectionCard
        title={`${supportInChart ? "Income + studio rent" : "Recorded income"} by month · all ${chart.length} month${chart.length === 1 ? "" : "s"}`}
        action={visibleSupport ? <SupportToggle included={supportInChart} /> : undefined}
        delay={200}
      >
        <CompositionBars metric="income"
          data={comp}
          currency={cur}
          highlight={scope === "month" ? selected : undefined}
          showTotals
        />
        {legend.length > 0 && (
          <details className="mt-5 text-sm text-muted"><summary className="cursor-pointer">View all sources in this chart</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">
            {legend.map((l) => (
              <span key={l.name} className="flex min-w-0 items-start gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: l.color }}
                />
                <span className="min-w-0 flex-1 break-words text-cream-dim">{l.name}</span>
                <span className="tnum text-faint">
                  {formatMoney(l.total, cur, { cents: false })}
                </span>
              </span>
            ))}
          </div></details>
        )}
        <p className="mt-4 text-xs text-muted">
          Each bar is one month, split by who paid you. Click a bar — or pick a
          month above — to see that month’s breakdown below. Months without recorded deposits show zero.{supportInChart && " Studio rent support is stacked on top; it is not a deposit, so the breakdown below stays bank-only."} The window ends with the latest posted bank activity.
        </p>
      </SectionCard>

      {/* Where it came from — focused breakdown for the active scope */}
      <SectionCard
        title={`Where it came from · ${scopeLabel}`}
        delay={260}
        className="mt-4"
      >
        {focus.segments.length ? (
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
            <div className="shrink-0">
              <Donut
                slices={focus.segments.map((s) => ({
                  label: s.name,
                  href: detailHref({ metric: "income", months: scopeMonths, source: s.name }),
                  value: s.total,
                  color: s.color,
                }))}
                total={focus.total}
                currency={cur}
                size={210}
                centerLabel="Earned"
                totalHref={detailHref({ metric: "income", months: scopeMonths, source: selectedSource || undefined })}
              />
            </div>
            <div className="w-full flex-1 space-y-3.5">
              {focus.segments.map((s) => {
                const pct = focus.total ? (s.total / focus.total) * 100 : 0;
                return (
                  <div key={s.name}>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: s.color }}
                      />
                      <span className="min-w-0 flex-1 break-words text-cream-dim">{s.name}</span>
                      <span className="shrink-0 text-xs text-faint">
                        · {s.count}×
                      </span>
                      <span className="tnum ml-auto shrink-0 text-cream">
                        <DetailLink query={{ metric: "income", months: scopeMonths, source: s.name, denominatorSource: selectedSource || undefined, statistic: "share" }}>{formatMoney(s.total, cur, { cents: false })}</DetailLink>
                      </span>
                      <span className="tnum w-10 shrink-0 text-right text-muted">
                        {Math.round(pct)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: s.color }}
                      />
                    </div>
                    {nScope > 1 && (
                      <div className="mt-0.5 text-[0.65rem] text-faint">
                        {formatMoney(s.total / nScope, cur, { cents: false })}/mo
                        average
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted">
            No income in {scopeLabel}.
          </p>
        )}
      </SectionCard>

      <SectionCard title={`Recorded income by source · ${scopeLabel}`} className="mt-4">
        <DataTable title={`Recorded income by source · ${scopeLabel}`} currency={cur} defaultSort={{ key: "income", direction: "desc" }}
          columns={[
            { key: "source", label: "Source" },
            { key: "income", label: "Recorded income", format: "money", total: true },
            { key: "count", label: "Deposits", format: "number", total: true },
            { key: "share", label: "Income share", format: "percent" },
            { key: "averageDeposit", label: "Average deposit", format: "money" },
            { key: "monthlyAverage", label: "Monthly average", format: "money" },
            { key: "activeMonths", label: "Months paid", format: "number" },
            { key: "first", label: "First deposit", format: "date" },
            { key: "last", label: "Latest deposit", format: "date" },
          ]}
          rows={focus.segments.map((source) => {
            const deposits = state.transactions.filter((t) => isIncome(t) && scopeMonths.includes(t.date.slice(0, 7)) && incomeSourceLabel(t.merchantName, t.name) === source.name);
            const dates = deposits.map((t) => t.date).sort();
            return { id: source.name, href: detailHref({ metric: "income", source: source.name, months: scopeMonths }), linkLabel: "Inspect deposits", cellHrefs: Object.fromEntries(["income", "count", "share", "averageDeposit", "monthlyAverage", "activeMonths", "first", "last"].map((key) => [key, detailHref({ metric: "income", source: source.name, months: scopeMonths, denominatorSource: selectedSource || undefined, statistic: key === "averageDeposit" ? "average" : key === "monthlyAverage" ? "monthly" : key === "share" ? "share" : undefined })])), values: {
              source: source.name, income: source.total, count: source.count,
              share: focus.total ? source.total / focus.total * 100 : null,
              averageDeposit: source.count ? source.total / source.count : null,
              monthlyAverage: source.total / nScope,
              activeMonths: new Set(dates.map((date) => date.slice(0, 7))).size,
              first: dates[0] ?? null, last: dates[dates.length - 1] ?? null,
            } };
          })} />
      </SectionCard>

      {excluded.length > 0 && <SectionCard title={`Other money in · ${scopeLabel}`} className="mt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm text-muted">{excluded.length} deposits excluded from income. Transfers can include money moved between your own accounts.</p>
          <p className="tnum text-xl text-cream"><DetailLink query={{ metric: "deposits", months: scopeMonths, source: selectedSource || undefined }}>{formatMoney(excludedTotal, cur)}</DetailLink></p>
        </div>
        <details className="mt-4" open>
          <summary className="cursor-pointer text-sm text-muted">Review excluded deposits</summary>
          <div className="mt-3"><DataTable title={`Excluded deposits · ${scopeLabel}`} currency={cur} defaultSort={{ key: "date", direction: "desc" }}
            columns={[
              { key: "date", label: "Date", format: "date" },
              { key: "name", label: "Bank description" },
              { key: "reason", label: "Exclusion reason" },
              { key: "amount", label: "Deposit", format: "money", total: true },
              { key: "account", label: "Account" },
              { key: "source", label: "Data source" },
            ]}
            rows={excluded.map((t) => ({ id: t.id, href: detailHref({ metric: "transaction", record: t.id, account: t.accountId }), linkLabel: "Inspect deposit", cellHrefs: { amount: detailHref({ metric: "transaction", record: t.id, account: t.accountId }) }, values: {
              date: t.date, name: t.name, reason: nonIncomeDepositReason(t) ?? categoryMeta(effectiveCategory(t)).label,
              amount: -t.amount, account: state.accounts.find((a) => a.id === t.accountId)?.name ?? "Unknown account", source: t.source,
            } }))} /></div>
        </details>
      </SectionCard>}

      {/* Largest deposits in scope */}
      {bigDeposits.length > 0 && (
        <SectionCard
          title={`Largest deposits · ${scopeLabel}`}
          delay={320}
          className="mt-4"
        >
          <ul className="space-y-2.5">
            {bigDeposits.map((t) => (
              <li key={t.id} className="flex items-center gap-3 text-sm">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border hairline bg-surface-2 text-sm text-slate">
                  {incomeSourceLabel(t.merchantName, t.name).slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-cream">
                    {incomeSourceLabel(t.merchantName, t.name)}
                  </div>
                  <div className="text-xs text-faint">{formatDate(t.date)}</div>
                </div>
                <span className="tnum ml-auto shrink-0 text-blue">
                  <DetailLink query={{ metric: "transaction", record: t.id, account: t.accountId }}>{formatMoney(-t.amount, cur)}</DetailLink>
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
      </>)}
    </div>
  );
}
