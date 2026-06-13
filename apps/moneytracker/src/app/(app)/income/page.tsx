import { loadScopedState } from "@/lib/scoped-state";
import {
  incomeBreakdown,
  incomeMonths,
  incomeSources,
  largestDeposits,
} from "@/lib/insights";
import { MonthComposition } from "@/lib/analytics";
import { categoryMeta, resolveCategoryKey } from "@/lib/categories";
import { displayPayee } from "@/lib/aliases";
import { formatMoney, formatMonth, formatDate } from "@/lib/format";
import { Donut } from "@/components/charts/Donut";
import { CompositionBars } from "@/components/charts/CompositionBars";
import { MonthPicker } from "@/components/MonthPicker";
import { SectionCard, EmptyState, StatCard, PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { state, focus } = await loadScopedState();
  const cur = state.accounts[0]?.currency ?? "USD";
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

  const sp = await searchParams;
  const selected =
    sp.month && months.includes(sp.month) ? sp.month : months[months.length - 1];

  const { byMonth, legend } = incomeBreakdown(state);
  const byMonthMap = new Map(byMonth.map((m) => [m.month, m]));
  const selMonth = byMonthMap.get(selected) ?? {
    month: selected,
    total: 0,
    segments: [],
  };

  // Rolling 12-month window for the trend chart and the period averages.
  const chartMonths = months.slice(-12);
  const chart = chartMonths.map((m) => byMonthMap.get(m)!);
  const windowTotal = chart.reduce((a, m) => a + m.total, 0);
  const monthlyAvg = chart.length ? windowTotal / chart.length : 0;

  // Delta vs the previous income month.
  const idx = months.indexOf(selected);
  const prevMonth = idx > 0 ? months[idx - 1] : null;
  const prevTotal = prevMonth ? (byMonthMap.get(prevMonth)?.total ?? 0) : null;
  const delta =
    prevTotal && prevTotal > 0
      ? ((selMonth.total - prevTotal) / prevTotal) * 100
      : null;
  const vsAvg =
    monthlyAvg > 0 ? ((selMonth.total - monthlyAvg) / monthlyAvg) * 100 : null;

  const sources = incomeSources(state, 12);
  const deposits = largestDeposits(state, 12, 5);

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

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-3">
        <PageHeading
          title="Income"
          subtitle={
            focus
              ? `${focus.name} · where your money comes from, month by month.`
              : "Where all your money comes from, month by month."
          }
        />
        <div className="mb-1 shrink-0">
          <MonthPicker months={months} selected={selected} />
        </div>
      </div>

      {/* Stat row */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label={`Income · ${formatMonth(selected)}`}
          value={formatMoney(selMonth.total, cur, { cents: false })}
          accent="blue"
          sub={
            delta != null ? (
              <span className={delta >= 0 ? "text-blue" : "text-coral"}>
                {delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(delta))}% vs{" "}
                {prevMonth ? formatMonth(prevMonth) : "prev"}
              </span>
            ) : (
              "—"
            )
          }
        />
        <StatCard
          label="Average / month"
          value={formatMoney(monthlyAvg, cur, { cents: false })}
          accent="cream"
          delay={60}
          sub={`across ${chart.length} month${chart.length === 1 ? "" : "s"}`}
        />
        <StatCard
          label="This month vs average"
          value={
            vsAvg == null
              ? "—"
              : `${vsAvg >= 0 ? "+" : "−"}${Math.abs(Math.round(vsAvg))}%`
          }
          accent={vsAvg != null && vsAvg >= 0 ? "blue" : "coral"}
          delay={120}
          sub={vsAvg != null && vsAvg >= 0 ? "above your norm" : "below your norm"}
        />
      </div>

      {/* Where it came from · selected month */}
      <SectionCard title={`Where it came from · ${formatMonth(selected)}`} delay={160}>
        {selMonth.segments.length ? (
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
            <div className="shrink-0">
              <Donut
                slices={selMonth.segments.map((s) => ({
                  label: s.name,
                  value: s.total,
                  color: s.color,
                }))}
                total={selMonth.total}
                currency={cur}
                size={210}
                centerLabel="Earned"
              />
            </div>
            <div className="w-full flex-1 space-y-3.5">
              {selMonth.segments.map((s) => {
                const pct = selMonth.total ? (s.total / selMonth.total) * 100 : 0;
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
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted">
            No income in {formatMonth(selected)}.
          </p>
        )}
      </SectionCard>

      {/* Income by month — stacked by source, click a bar to select the month */}
      <SectionCard
        title={`Income by month · last ${chart.length} month${chart.length === 1 ? "" : "s"}`}
        delay={220}
        className="mt-4"
      >
        <CompositionBars data={comp} currency={cur} highlight={selected} />
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
      </SectionCard>

      {/* Income sources over the rolling window */}
      <SectionCard title="Income sources · last 12 months" delay={280} className="mt-4">
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

      {/* Largest single deposits */}
      {deposits.length > 0 && (
        <SectionCard title="Largest deposits · last 12 months" delay={340} className="mt-4">
          <ul className="space-y-2.5">
            {deposits.map((t) => {
              const meta = categoryMeta(resolveCategoryKey(t));
              return (
                <li key={t.id} className="flex items-center gap-3 text-sm">
                  <span>{meta.glyph}</span>
                  <div className="min-w-0">
                    <div className="truncate text-cream">
                      {displayPayee(t.merchantName, t.name)}
                    </div>
                    <div className="text-xs text-faint">{formatDate(t.date)}</div>
                  </div>
                  <span className="tnum ml-auto text-blue">
                    {formatMoney(-t.amount, cur)}
                  </span>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
