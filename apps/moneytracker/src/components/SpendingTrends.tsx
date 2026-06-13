import { AppState } from "@/lib/types";
import { spendingPace, categoryTrends } from "@/lib/analytics";
import { formatMoney, formatMonth } from "@/lib/format";
import { SectionCard } from "@/components/ui";
import { Sparkline } from "@/components/charts/Sparkline";

export function SpendingTrends({
  state,
  month,
  prevMonth,
  currency = "USD",
  delay = 0,
}: {
  state: AppState;
  month: string;
  prevMonth: string | null;
  currency?: string;
  delay?: number;
}) {
  const pace = spendingPace(state, month, prevMonth);
  const { months, trends } = categoryTrends(state, 6, 6);

  // Build the two cumulative pace lines.
  const W = 720;
  const H = 170;
  const pad = 10;
  const maxY = Math.max(
    1,
    ...pace.points.map((p) => Math.max(p.current ?? 0, p.previous ?? 0)),
  );
  const x = (day: number) =>
    pad + ((day - 1) / Math.max(1, pace.daysInMonth - 1)) * (W - pad * 2);
  const y = (v: number) => H - pad - (v / maxY) * (H - pad * 2);
  const pathFor = (key: "current" | "previous") => {
    const pts = pace.points
      .filter((p) => p[key] != null)
      .map((p) => [x(p.day), y(p[key] as number)] as const);
    return pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  };

  const paceDelta =
    pace.previousToDate != null ? pace.currentToDate - pace.previousToDate : null;

  return (
    <>
      {/* Spending pace vs last month */}
      <SectionCard
        title="Spending pace"
        delay={delay}
        className="mt-4"
        action={
          paceDelta != null ? (
            <span className={`text-xs ${paceDelta <= 0 ? "text-blue" : "text-coral"}`}>
              {paceDelta <= 0 ? "▼" : "▲"}{" "}
              {formatMoney(Math.abs(paceDelta), currency, { cents: false })} vs{" "}
              {prevMonth ? formatMonth(prevMonth) : "last mo"} at this point
            </span>
          ) : null
        }
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
          {prevMonth && (
            <path
              d={pathFor("previous")}
              fill="none"
              stroke="var(--color-muted)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              opacity={0.7}
            />
          )}
          <path
            d={pathFor("current")}
            fill="none"
            stroke="var(--color-coral)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-coral" /> {formatMonth(month)} (
            {formatMoney(pace.currentToDate, currency, { cents: false })} so far)
          </span>
          {prevMonth && (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-muted" /> {formatMonth(prevMonth)}
            </span>
          )}
        </div>
      </SectionCard>

      {/* Category trends */}
      {trends.length > 0 && months.length >= 2 && (
        <SectionCard
          title="Category trends"
          delay={delay + 40}
          className="mt-4"
          action={
            <span className="text-xs text-muted">last {months.length} months</span>
          }
        >
          <ul className="divide-y divide-[var(--color-line)]">
            {trends.map((t) => (
              <li key={t.category} className="flex items-center gap-3 py-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border hairline bg-surface-2 text-sm">
                  {t.glyph}
                </span>
                <span className="w-28 shrink-0 truncate text-sm text-cream-dim">
                  {t.label}
                </span>
                <Sparkline values={t.series} color={t.color} />
                <div className="ml-auto text-right">
                  <div className="tnum text-sm text-cream">
                    {formatMoney(t.latest, currency, { cents: false })}
                  </div>
                  <div
                    className={`tnum text-[0.65rem] ${t.delta > 0 ? "text-coral" : t.delta < 0 ? "text-blue" : "text-faint"}`}
                  >
                    {t.delta === 0
                      ? "—"
                      : `${t.delta > 0 ? "▲" : "▼"} ${formatMoney(Math.abs(t.delta), currency, { cents: false })}`}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </>
  );
}
