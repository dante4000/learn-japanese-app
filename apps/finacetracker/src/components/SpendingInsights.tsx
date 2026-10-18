import { detailHref } from "@/lib/details";
import { DetailLink } from "@/components/DetailPanel";
import { TimeSeriesChart } from "./charts/TimeSeriesChart";
import Link from "@/components/AppLink";
import { AppState } from "@/lib/types";
import {
  BASELINE_ACCOUNT_ID,
  isSpend,
  isSyntheticBaseline,
  spendingByAccount,
  dailySpending,
  categoryMovers,
} from "@/lib/analytics";
import { formatMoney, formatMonth } from "@/lib/format";
import { SectionCard } from "@/components/ui";

const ACCT_COLORS = ["#2563eb", "#6366f1", "#0ea5e9", "#7c3aed", "#0284c7", "#8b5cf6"];

export function SpendingInsights({
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
  isLatestMonth?: boolean;
  delay?: number;
}) {
  const byAccount = spendingByAccount(state, month);
  const acctTotal = byAccount.reduce((a, c) => a + c.total, 0);
  const daily = dailySpending(state, month);
  const movers = categoryMovers(state, month, prevMonth, 6);
  const dailyRows = daily.days.map((day, i) => {
    const recorded = day.day <= daily.throughDay;
    const transactions = recorded ? state.transactions.filter((t) => t.date === day.date && isSpend(t)) : [];
    const posted = transactions.filter((t) => !isSyntheticBaseline(t));
    const query = { metric: "spending" as const, from: day.date, to: day.date };
    return { id: day.date, href: detailHref(query), linkLabel: "Inspect day", cellHrefs: Object.fromEntries(["purchases", "refunds", "estimates", "net", "cumulative", "count", "change"].map((key) => [key, detailHref({ ...query, from: key === "cumulative" ? `${month}-01` : day.date, part: key === "purchases" || key === "refunds" || key === "estimates" ? key : undefined, priorFrom: key === "change" && i > 0 ? daily.days[i - 1].date : undefined, priorTo: key === "change" && i > 0 ? daily.days[i - 1].date : undefined })])), values: {
      date: day.date,
      purchases: recorded ? posted.reduce((sum, t) => sum + Math.max(0, t.amount), 0) : null,
      refunds: recorded ? posted.reduce((sum, t) => sum + Math.max(0, -t.amount), 0) : null,
      estimates: recorded ? transactions.filter(isSyntheticBaseline).reduce((sum, t) => sum + t.amount, 0) : null,
      net: recorded ? day.total : null,
      cumulative: recorded ? daily.cumulative[i] : null,
      count: recorded ? posted.filter((t) => t.amount > 0).length : null,
      change: recorded && i > 0 ? day.total - daily.days[i - 1].total : null,
    } };
  });

  return (
    <>
      {/* Spending by account */}
      <SectionCard
        title={`By account · ${formatMonth(month)}`}
        delay={delay}
        className="mt-4"
      >
        {byAccount.length ? (
          <ul className="space-y-3.5">
            {byAccount.map((a, i) => {
              const pct = acctTotal ? (a.total / acctTotal) * 100 : 0;
              return (
                <li key={a.accountId}>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: ACCT_COLORS[i % ACCT_COLORS.length] }}
                    />
                    <span className="min-w-0 break-words text-cream-dim">{a.name}</span>
                    <span className="text-xs text-faint">· {a.count}×</span>
                    <span className="tnum ml-auto text-cream">
                      <DetailLink query={{ metric: "spending", account: a.accountId === BASELINE_ACCOUNT_ID ? "all" : a.accountId, part: a.accountId === BASELINE_ACCOUNT_ID ? "estimates" : undefined, months: [month] }}>{formatMoney(a.total, currency, { cents: false })}</DetailLink>
                    </span>
                    <span className="tnum w-10 text-right text-muted">
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, pct))}%`,
                        background: ACCT_COLORS[i % ACCT_COLORS.length],
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted">No spending this month.</p>
        )}
      </SectionCard>

      {/* Daily spending + pace */}
      <SectionCard
        title={`Daily spending · ${formatMonth(month)}`}
        delay={delay + 40}
        className="mt-4"
        action={
          daily.projected != null ? (
            <span className="text-xs text-muted">
              on pace for{" "}
              <span className="tnum text-cream">
                <DetailLink query={{ metric: "spending", months: [month], statistic: "daily" }}>{formatMoney(daily.projected, currency, { cents: false })}</DetailLink>
              </span>
            </span>
          ) : null
        }
      >
        <div className="mb-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
          <div>
            <div className="label-eyebrow">Spent so far</div>
            <div className="tnum mt-1 text-lg text-coral">
              <DetailLink query={{ metric: "spending", months: [month], statistic: "daily" }}>{formatMoney(daily.total, currency, { cents: false })}</DetailLink>
            </div>
          </div>
          <div>
            <div className="label-eyebrow">Avg / day</div>
            <div className="tnum mt-1 text-lg text-cream">
              <DetailLink query={{ metric: "spending", months: [month], statistic: "daily" }}>{formatMoney(daily.avgPerDay, currency, { cents: false })}</DetailLink>
            </div>
          </div>
          <div>
            <div className="label-eyebrow">
              {daily.projected != null ? "Projected" : "Days"}
            </div>
            <div className="tnum mt-1 text-lg text-cream">
              {daily.projected != null
                ? formatMoney(daily.projected, currency, { cents: false })
                : `${daily.throughDay}/${daily.daysInMonth}`}
            </div>
          </div>
        </div>
        <TimeSeriesChart title={`Daily spending · ${formatMonth(month)}`} currency={currency}
          data={daily.days.map((d) => ({ id: d.date, label: String(d.day), detailHref: detailHref({ metric: "spending", from: d.date, to: d.date }), valueHrefs: { spending: detailHref({ metric: "spending", from: d.date, to: d.date }) }, values: { spending: d.day <= daily.throughDay ? d.total : null } }))}
          series={[{ key: "spending", label: "Net spending", color: "var(--color-coral)" }]}
          table={{ rows: dailyRows, columns: [
            { key: "date", label: "Date", format: "date" },
            { key: "purchases", label: "Posted purchases", format: "money", total: true },
            { key: "refunds", label: "Refunds", format: "money", total: true },
            { key: "estimates", label: "Estimated bills", format: "money", total: true },
            { key: "net", label: "Net spending", format: "money", total: true },
            { key: "cumulative", label: "Month to date", format: "money" },
            { key: "count", label: "Purchases", format: "number", total: true },
            { key: "change", label: "Change vs prior day", format: "money" },
          ] }} />
        <p className="mt-3 text-xs text-muted">Day of month. Refunds can put net spending below zero. Future days have no value.</p>
      </SectionCard>

      {/* Biggest movers vs last month */}
      {prevMonth && movers.length > 0 && (
        <SectionCard
          title="Biggest changes"
          delay={delay + 80}
          className="mt-4"
          action={
            <span className="text-xs text-muted">
              vs {formatMonth(prevMonth)}
            </span>
          }
        >
          <ul className="space-y-1">
            {movers.map((m) => {
              const up = m.delta > 0;
              return (
                <li key={m.category}>
                  <Link
                    href={detailHref({ metric: "spending", category: m.category, months: [month], priorMonths: prevMonth ? [prevMonth] : undefined })}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border hairline bg-surface-2">
                      {m.glyph}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm text-cream">{m.label}</div>
                      <div className="tnum text-xs text-faint">
                        {formatMoney(m.previous, currency, { cents: false })} →{" "}
                        {formatMoney(m.current, currency, { cents: false })}
                      </div>
                    </div>
                    <span
                      className={`tnum ml-auto shrink-0 text-sm ${up ? "text-coral" : "text-blue"}`}
                    >
                      {up ? "▲" : "▼"}{" "}
                      {formatMoney(Math.abs(m.delta), currency, { cents: false })}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}
    </>
  );
}
