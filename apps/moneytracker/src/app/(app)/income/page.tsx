import { loadScopedState } from "@/lib/scoped-state";
import {
  incomeBreakdown,
  incomeMonths,
  mergeIncomeMonths,
  largestDepositsForMonths,
  filterBySource,
  withPhantomIncome,
  PHANTOM_INCOME,
} from "@/lib/insights";
import { MonthComposition } from "@/lib/analytics";
import { incomeSourceLabel } from "@/lib/aliases";
import { formatMoney, formatMonth, formatDate } from "@/lib/format";
import { Donut } from "@/components/charts/Donut";
import { CompositionBars } from "@/components/charts/CompositionBars";
import { MonthPicker } from "@/components/MonthPicker";
import { IncomeScope, Scope } from "@/components/IncomeScope";
import { SourceToggle } from "@/components/SourceToggle";
import { PhantomIncomeToggle } from "@/components/PhantomIncomeToggle";
import { SectionCard, EmptyState, StatCard, PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

const RARELIQUID = "rareliquid";

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

  // RareLiquid-only view: scope the whole tab to that single payer. Only offered
  // when there's actually RareLiquid income to show.
  const rareState = filterBySource(fullState, RARELIQUID);
  const hasRare = incomeMonths(rareState).length > 0;
  const onlyRare = hasRare && sp.src === RARELIQUID;
  const state = onlyRare ? rareState : fullState;

  const months = incomeMonths(state);

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

  // Phantom income sources (rent covered on your behalf, never in the feed),
  // each switched on by its own ?<key>=on param. Layered onto every month so the
  // chart, donut, stat row, and legend reflect true total compensation.
  const activePhantom = PHANTOM_INCOME.filter((p) => sp[p.key] === "on");
  const { byMonth: byMonthRaw } = incomeBreakdown(state);
  const byMonth = withPhantomIncome(byMonthRaw, activePhantom);
  const byMonthMap = new Map(byMonth.map((m) => [m.month, m]));
  const latest = months[months.length - 1];
  const selected =
    scope === "month" && sp.month && months.includes(sp.month)
      ? sp.month
      : latest;

  const chartMonths = months.slice(-12);
  const chart = chartMonths.map((m) => byMonthMap.get(m)!);

  // Resolve the active scope into a set of months + the period to compare with.
  let scopeMonths: string[];
  let priorMonths: string[];
  let scopeLabel: string;
  let priorLabel: string;
  if (scope === "ytd") {
    const year = latest.slice(0, 4);
    const prevYear = String(Number(year) - 1);
    scopeMonths = months.filter((m) => m.slice(0, 4) === year);
    priorMonths = scopeMonths
      .map((m) => prevYear + m.slice(4))
      .filter((m) => byMonthMap.has(m));
    scopeLabel = `YTD ${year}`;
    priorLabel = `YTD ${prevYear}`;
  } else if (scope === "year") {
    scopeMonths = chartMonths;
    // The 12 months immediately before the scope window — but only as many as we
    // actually have, so the label never claims a full year of prior data we
    // don't hold.
    priorMonths = months.slice(-24, -12);
    scopeLabel = `last ${chartMonths.length} mo`;
    priorLabel = priorMonths.length ? `prior ${priorMonths.length} mo` : "prior period";
  } else {
    const idx = months.indexOf(selected);
    scopeMonths = [selected];
    priorMonths = idx > 0 ? [months[idx - 1]] : [];
    scopeLabel = formatMonth(selected);
    priorLabel = priorMonths.length ? formatMonth(priorMonths[0]) : "prev";
  }

  const focus = mergeIncomeMonths(
    scopeMonths.map((m) => byMonthMap.get(m)!).filter(Boolean),
  );
  const nScope = scopeMonths.length || 1;
  const monthlyAvg = focus.total / nScope;
  const deposits = focus.segments.reduce((a, s) => a + s.count, 0);
  const priorTotal = priorMonths.length
    ? priorMonths.reduce((a, m) => a + (byMonthMap.get(m)?.total ?? 0), 0)
    : null;
  const delta =
    priorTotal && priorTotal > 0
      ? ((focus.total - priorTotal) / priorTotal) * 100
      : null;
  const topSeg = focus.segments[0] ?? null;
  const topShare =
    focus.total > 0 && topSeg ? (topSeg.total / focus.total) * 100 : null;

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
            onlyRare
              ? "RareLiquid only · earnings from this source, month by month."
              : acct
                ? `${acct.name} · where your money comes from, month by month.`
                : "Where all your money comes from, month by month."
          }
        />
        <div className="mb-1 flex shrink-0 flex-wrap items-center gap-2">
          {PHANTOM_INCOME.map((p) => (
            <PhantomIncomeToggle
              key={p.key}
              paramKey={p.key}
              label={p.short}
              monthly={p.monthly}
              active={sp[p.key] === "on"}
            />
          ))}
          {hasRare && (
            <SourceToggle
              value={RARELIQUID}
              label="RareLiquid only"
              active={onlyRare}
            />
          )}
          <IncomeScope scope={scope} />
          {scope === "month" && (
            <MonthPicker months={months} selected={selected} />
          )}
        </div>
      </div>

      {/* Stat row — scope-aware */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={`Income · ${scopeLabel}`}
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

      {/* Income by month — the overview. Click a bar to focus that month. */}
      <SectionCard
        title={`Income by month · last ${chart.length} month${chart.length === 1 ? "" : "s"}`}
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
          month above — to see that month’s breakdown below.
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
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: s.color }}
                      />
                      <span className="truncate text-cream-dim">{s.name}</span>
                      <span className="shrink-0 text-xs text-faint">
                        · {s.count}×
                      </span>
                      <span className="tnum ml-auto text-cream">
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
                <div className="min-w-0">
                  <div className="truncate text-cream">
                    {incomeSourceLabel(t.merchantName, t.name)}
                  </div>
                  <div className="text-xs text-faint">{formatDate(t.date)}</div>
                </div>
                <span className="tnum ml-auto text-blue">
                  {formatMoney(-t.amount, cur)}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
