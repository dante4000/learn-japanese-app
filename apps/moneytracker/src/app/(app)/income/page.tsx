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
import { eligibleEmployerHousingSupport, employerHousingSupportTotal } from "@/lib/income-support";
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
  const months = allIncome.months.length
    ? calendarMonths(allIncome.months[allIncome.months.length - 1], Math.max(12, allIncome.months.length))
    : support && !acct ? calendarMonths(todayKey().slice(0, 7), 12) : [];
  const visibleSupport = eligibleEmployerHousingSupport(support, supportOnly ? "__employer_housing__" : selectedSource, Boolean(acct));

  if (months.length === 0) {
    return (
      <div>
        <PageHeading
          title="Income"
          subtitle="Where all your money comes from, month by month."
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
    sp.scope === "ytd" ? "ytd" : sp.scope === "year" ? "year" : "month";

  const { byMonth } = incomeBreakdown(state);
  const byMonthMap = new Map(byMonth.map((m) => [m.month, m]));
  const latest = months[months.length - 1];
  const selected =
    scope === "month" && sp.month && months.includes(sp.month)
      ? sp.month
      : latest;

  const chartMonths = calendarMonths(latest, 12);
  const chart = chartMonths.map((month) => byMonthMap.get(month) ?? { month, total: 0, segments: [] });

  // Resolve the active scope into a set of months + the period to compare with.
  let scopeMonths: string[];
  let priorMonths: string[];
  let scopeLabel: string;
  let priorLabel: string;
  if (scope === "ytd") {
    const year = latest.slice(0, 4);
    const prevYear = String(Number(year) - 1);
    scopeMonths = calendarMonths(latest, Number(latest.slice(5, 7)));
    priorMonths = scopeMonths.map((m) => prevYear + m.slice(4));
    scopeLabel = `YTD ${year}`;
    priorLabel = `YTD ${prevYear}`;
  } else if (scope === "year") {
    scopeMonths = chartMonths;
    priorMonths = calendarMonths(chartMonths[0], 13).slice(0, 12);
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
                : "Where all your money comes from, month by month."
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
          value={formatMoney(focus.total, cur, { cents: false })}
          accent="blue"
          sub={`${deposits} deposit${deposits === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Average / month"
          value={formatMoney(monthlyAvg, cur, { cents: false })}
          accent="cream"
          delay={60}
          sub={`across ${nScope} month${nScope === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Top source"
          value={topShare == null ? "—" : `${Math.round(topShare)}%`}
          accent="cream"
          delay={120}
          sub={
            topSeg ? (
              <span className="block max-w-[12rem] truncate">{topSeg.name}</span>
            ) : (
              "—"
            )
          }
        />
        <StatCard
          label={`vs ${priorLabel}`}
          value={
            delta == null
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

      {!acct && (visibleSupport || !support && !selectedSource) && (
        <SectionCard title="Employer-paid support · studio rent" className="mb-5">
          {support ? <>
            <p className="text-sm text-muted">{support.source} pays {formatMoney(support.amount, cur, { cents: false })}/month toward studio rent. This does not enter your bank ledger.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
              <div><div className="label-eyebrow">Support · {scopeLabel}</div><p className="tnum mt-1 text-xl text-slate">{formatMoney(supportTotal, cur, { cents: false })}</p></div>
              {!supportOnly && <div><div className="label-eyebrow">Income + employer support</div><p className="tnum mt-1 text-xl text-blue">{formatMoney(focus.total + supportTotal, cur, { cents: false })}</p></div>}
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
        title={`Recorded income by month · last ${chart.length} month${chart.length === 1 ? "" : "s"}`}
        delay={200}
      >
        <CompositionBars
          data={comp}
          currency={cur}
          highlight={scope === "month" ? selected : undefined}
          showTotals
        />
        {legend.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
            {legend.map((l) => (
              <span key={l.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: l.color }}
                />
                <span className="text-cream-dim">{l.name}</span>
                <span className="tnum text-faint">
                  {formatMoney(l.total, cur, { cents: false })}
                </span>
              </span>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-muted">
          Each bar is one month, split by who paid you. Click a bar — or pick a
          month above — to see that month’s breakdown below. Months without recorded deposits show zero. The window ends with the latest posted bank activity.
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
                  value: s.total,
                  color: s.color,
                }))}
                total={focus.total}
                currency={cur}
                size={210}
                centerLabel="Earned"
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
                      <span className="truncate text-cream-dim">{s.name}</span>
                      <span className="shrink-0 text-xs text-faint">
                        · {s.count}×
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[380px] text-sm">
            <thead><tr><th scope="col" className="py-2 text-left">Source</th><th scope="col" className="px-2 py-2 text-right">Recorded income</th><th scope="col" className="px-2 py-2 text-right">Deposits</th><th scope="col" className="py-2 text-right">Share</th></tr></thead>
            <tbody className="divide-y divide-[var(--color-line)]">{focus.segments.map((source) => <tr key={source.name}>
              <th scope="row" className="max-w-56 break-words py-3 text-left font-normal text-cream">{source.name}</th>
              <td className="tnum whitespace-nowrap px-2 py-3 text-right text-blue">{formatMoney(source.total, cur)}</td>
              <td className="tnum px-2 py-3 text-right">{source.count}</td>
              <td className="tnum py-3 text-right">{focus.total ? Math.round(source.total / focus.total * 100) : 0}%</td>
            </tr>)}</tbody>
          </table>
        </div>
      </SectionCard>

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
                  {formatMoney(-t.amount, cur)}
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
