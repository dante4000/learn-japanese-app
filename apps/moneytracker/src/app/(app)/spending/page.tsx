import { loadScopedState } from "@/lib/scoped-state";
import {
  availableMonths,
  spendingByCategory,
  monthlyComposition,
  categoryHabits,
  topMerchants,
} from "@/lib/analytics";
import { formatMoney, formatMonth } from "@/lib/format";
import { Donut } from "@/components/charts/Donut";
import { CompositionBars } from "@/components/charts/CompositionBars";
import { MonthPicker } from "@/components/MonthPicker";
import { SpendingInsights } from "@/components/SpendingInsights";
import { SpendingTrends } from "@/components/SpendingTrends";
import { SectionCard, EmptyState, StatCard, PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SpendingPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { state, focus } = await loadScopedState();
  const months = availableMonths(state);
  const cur = state.accounts[0]?.currency ?? "USD";

  if (months.length === 0) {
    return (
      <div>
        <PageHeading title="Spending" subtitle="Your monthly habits and where the money goes." />
        {state.accounts.length === 0 ? (
          <EmptyState />
        ) : (
          <SectionCard>
            <p className="py-10 text-center text-sm text-muted">
              No spending recorded yet. Import a CSV or sync a bank to see your
              habits here.
            </p>
          </SectionCard>
        )}
      </div>
    );
  }

  const sp = await searchParams;
  const selected =
    sp.month && months.includes(sp.month) ? sp.month : months[months.length - 1];

  const cats = spendingByCategory(state, selected);
  const total = cats.reduce((a, c) => a + c.total, 0);
  const comp = monthlyComposition(state, 12);
  const { habits, months: nMonths, avgMonthlyTotal } = categoryHabits(state, 12);
  const merchants = topMerchants(state, selected, 20);

  // delta vs previous available month
  const idx = months.indexOf(selected);
  const prevMonth = idx > 0 ? months[idx - 1] : null;
  const prevTotal = prevMonth
    ? spendingByCategory(state, prevMonth).reduce((a, c) => a + c.total, 0)
    : null;
  const delta =
    prevTotal && prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : null;
  const vsAvg =
    avgMonthlyTotal > 0 ? ((total - avgMonthlyTotal) / avgMonthlyTotal) * 100 : null;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-3">
        <PageHeading
          title="Spending"
          subtitle={
            focus
              ? `${focus.name} · monthly habits and where the money goes.`
              : "Your monthly habits and where the money goes."
          }
        />
        <div className="mb-1 shrink-0">
          <MonthPicker months={months} selected={selected} />
        </div>
      </div>

      {/* Stat row */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label={`Spent · ${formatMonth(selected)}`}
          value={formatMoney(total, cur, { cents: false })}
          accent="coral"
          sub={
            delta != null ? (
              <span className={delta <= 0 ? "text-blue" : "text-coral"}>
                {delta <= 0 ? "▼" : "▲"} {Math.abs(Math.round(delta))}% vs{" "}
                {prevMonth ? formatMonth(prevMonth) : "prev"}
              </span>
            ) : (
              "—"
            )
          }
        />
        <StatCard
          label={`Average / month`}
          value={formatMoney(avgMonthlyTotal, cur, { cents: false })}
          accent="cream"
          delay={60}
          sub={`across ${nMonths} month${nMonths === 1 ? "" : "s"}`}
        />
        <StatCard
          label="This month vs average"
          value={
            vsAvg == null
              ? "—"
              : `${vsAvg >= 0 ? "+" : "−"}${Math.abs(Math.round(vsAvg))}%`
          }
          accent={vsAvg != null && vsAvg <= 0 ? "blue" : "coral"}
          delay={120}
          sub={vsAvg != null && vsAvg <= 0 ? "below your norm" : "above your norm"}
        />
      </div>

      {/* Distribution for the selected month */}
      <SectionCard title={`Where it went · ${formatMonth(selected)}`} delay={160}>
        {cats.length ? (
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
            <div className="shrink-0">
              <Donut
                slices={cats.map((c) => ({
                  label: c.label,
                  value: c.total,
                  color: c.color,
                  key: c.category,
                }))}
                total={total}
                currency={cur}
                size={210}
                hrefBase="/transactions"
              />
            </div>
            <div className="w-full flex-1 space-y-3.5">
              {cats.map((c) => {
                const pct = total ? (c.total / total) * 100 : 0;
                return (
                  <div key={c.category}>
                    <div className="flex items-center gap-2 text-sm">
                      <span>{c.glyph}</span>
                      <span className="text-cream-dim">{c.label}</span>
                      <span className="text-xs text-faint">· {c.count}×</span>
                      <span className="tnum ml-auto text-cream">
                        {formatMoney(c.total, cur, { cents: false })}
                      </span>
                      <span className="tnum w-10 text-right text-muted">
                        {Math.round(pct)}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: c.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted">
            No spending in {formatMonth(selected)}.
          </p>
        )}
      </SectionCard>

      {/* By account · daily spending + pace · biggest movers */}
      <SpendingInsights
        state={state}
        month={selected}
        prevMonth={prevMonth}
        currency={cur}
        isLatestMonth={selected === months[months.length - 1]}
        delay={180}
      />

      {/* Spending pace + category trends */}
      <SpendingTrends
        state={state}
        month={selected}
        prevMonth={prevMonth}
        currency={cur}
        delay={300}
      />

      {/* Habits over time */}
      <SectionCard
        title={`Habits over the last ${nMonths} month${nMonths === 1 ? "" : "s"}`}
        delay={220}
        className="mt-4"
      >
        <CompositionBars data={comp} currency={cur} highlight={selected} />
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          {habits.slice(0, 8).map((h) => (
            <div
              key={h.category}
              className="flex items-center gap-2.5 rounded-xl border hairline bg-surface px-3 py-2.5"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: h.color }}
              />
              <span className="text-sm text-cream-dim">{h.label}</span>
              <span className="ml-auto text-right">
                <span className="tnum block text-sm text-cream">
                  {formatMoney(h.monthlyAvg, cur, { cents: false })}/mo
                </span>
                <span className="text-[0.65rem] text-faint">
                  {Math.round(h.share * 100)}% · seen {h.monthsSeen}/{nMonths}
                </span>
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Top merchants for the month */}
      {merchants.length > 0 && (
        <SectionCard title={`Top merchants · ${formatMonth(selected)}`} delay={280} className="mt-4">
          <ul className="grid gap-3 sm:grid-cols-2">
            {merchants.map((m) => (
              <li key={m.name} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border hairline bg-surface-2 text-sm text-slate">
                  {m.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm text-cream">{m.name}</div>
                  <div className="text-xs text-faint">{m.count}×</div>
                </div>
                <span className="tnum ml-auto text-sm text-cream">
                  {formatMoney(m.total, cur, { cents: false })}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
