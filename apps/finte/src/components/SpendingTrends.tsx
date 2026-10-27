import { detailHref } from "@/lib/details";
import { TimeSeriesChart } from "./charts/TimeSeriesChart";
import Link from "@/components/AppLink";
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

  const through = (m: string, day: number) => `${m}-${String(Math.min(day, new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate())).padStart(2, "0")}`;
  const links = (day: number) => ({ current: detailHref({ metric: "spending", from: `${month}-01`, to: through(month, day) }), ...(prevMonth ? { previous: detailHref({ metric: "spending", from: `${prevMonth}-01`, to: through(prevMonth, day) }) } : {}) });
  const comparison = (day: number) => detailHref({ metric: "spending", from: `${month}-01`, to: through(month, day), priorFrom: prevMonth ? `${prevMonth}-01` : undefined, priorTo: prevMonth ? through(prevMonth, day) : undefined });
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
        <TimeSeriesChart title="Cumulative spending by day" currency={currency} kind="line"
          data={pace.points.map((p) => ({ label: String(p.day), detailHref: comparison(p.day), valueHrefs: links(p.day), values: { current: p.current, previous: p.previous } }))}
          series={[
            { key: "current", label: formatMonth(month), color: "var(--color-coral)" },
            ...(prevMonth ? [{ key: "previous", label: formatMonth(prevMonth), color: "var(--color-muted)", dashed: true }] : []),
          ]}
          table={{ columns: [
            { key: "day", label: "Day of month", format: "number" },
            { key: "current", label: `${formatMonth(month)} cumulative`, format: "money" },
            { key: "previous", label: prevMonth ? `${formatMonth(prevMonth)} cumulative` : "Prior month", format: "money" },
            { key: "difference", label: "Difference", format: "money" },
            { key: "differencePct", label: "Difference (%)", format: "percent" },
          ], rows: pace.points.map((point, i) => {
            const difference = point.current != null && point.previous != null ? point.current - point.previous : null;
            return { id: String(i), href: comparison(point.day), linkLabel: "Inspect comparison", cellHrefs: { ...links(point.day), difference: comparison(point.day), differencePct: comparison(point.day) }, values: {
              day: point.day, current: point.current, previous: point.previous,
              difference, differencePct: difference != null && point.previous ? difference / Math.abs(point.previous) * 100 : null,
            } };
          }) }} />
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
              <li key={t.category}>
                <Link
                  href={detailHref({ metric: "spending", category: t.category, months: [months[months.length - 1]], priorMonths: months.length > 1 ? [months[months.length - 2]] : undefined })}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-2"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border hairline bg-surface-2 text-sm">
                    {t.glyph}
                  </span>
                  <span className="min-w-0 flex-1 break-words text-sm text-cream-dim">
                    {t.label}
                  </span>
                  <span aria-hidden="true" className="hidden sm:block"><Sparkline values={t.series} color={t.color} /></span>
                  <span className="sr-only">
                    {months.map((m, i) => `${formatMonth(m)}: ${t.series[i] == null ? "No recorded activity; coverage unknown" : formatMoney(t.series[i]!, currency)}`).join("; ")}
                  </span>
                  <div className="ml-auto shrink-0 text-right">
                    <div className="tnum text-sm text-cream">
                      {formatMoney(t.latest, currency, { cents: false })}
                    </div>
                    <div
                      className={`tnum text-[0.65rem] ${(t.delta ?? 0) > 0 ? "text-coral" : (t.delta ?? 0) < 0 ? "text-blue" : "text-faint"}`}
                    >
                      {t.delta == null || t.delta === 0
                        ? "—"
                        : `${(t.delta ?? 0) > 0 ? "▲" : "▼"} ${formatMoney(Math.abs(t.delta!), currency, { cents: false })}`}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </>
  );
}
