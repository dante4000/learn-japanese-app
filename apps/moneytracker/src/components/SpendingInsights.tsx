import { AppState } from "@/lib/types";
import {
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
  isLatestMonth = false,
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
  const maxDay = Math.max(1, ...daily.days.map((d) => d.total));

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
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: ACCT_COLORS[i % ACCT_COLORS.length] }}
                    />
                    <span className="text-cream-dim">{a.name}</span>
                    <span className="text-xs text-faint">· {a.count}×</span>
                    <span className="tnum ml-auto text-cream">
                      {formatMoney(a.total, currency, { cents: false })}
                    </span>
                    <span className="tnum w-10 text-right text-muted">
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
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
          isLatestMonth && daily.projected != null ? (
            <span className="text-xs text-muted">
              on pace for{" "}
              <span className="tnum text-cream">
                {formatMoney(daily.projected, currency, { cents: false })}
              </span>
            </span>
          ) : null
        }
      >
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div>
            <div className="label-eyebrow">Spent so far</div>
            <div className="tnum mt-1 text-lg text-coral">
              {formatMoney(daily.total, currency, { cents: false })}
            </div>
          </div>
          <div>
            <div className="label-eyebrow">Avg / day</div>
            <div className="tnum mt-1 text-lg text-cream">
              {formatMoney(daily.avgPerDay, currency, { cents: false })}
            </div>
          </div>
          <div>
            <div className="label-eyebrow">
              {isLatestMonth ? "Projected" : "Days"}
            </div>
            <div className="tnum mt-1 text-lg text-cream">
              {isLatestMonth && daily.projected != null
                ? formatMoney(daily.projected, currency, { cents: false })
                : `${daily.throughDay}/${daily.daysInMonth}`}
            </div>
          </div>
        </div>
        <div className="flex h-28 items-end gap-px">
          {daily.days.map((d) => (
            <div
              key={d.day}
              className="flex-1 rounded-t-sm transition-all"
              style={{
                height: `${(d.total / maxDay) * 100}%`,
                minHeight: d.total > 0 ? 2 : 0,
                background:
                  d.total > 0 ? "var(--color-coral)" : "var(--color-line)",
              }}
              title={`${formatMonth(month)} ${d.day}: ${formatMoney(d.total, currency)}`}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[0.6rem] text-faint">
          <span>1</span>
          <span>{Math.ceil(daily.daysInMonth / 2)}</span>
          <span>{daily.daysInMonth}</span>
        </div>
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
          <ul className="space-y-2.5">
            {movers.map((m) => {
              const up = m.delta > 0;
              return (
                <li key={m.category} className="flex items-center gap-3">
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
                    className={`tnum ml-auto text-sm ${up ? "text-coral" : "text-blue"}`}
                  >
                    {up ? "▲" : "▼"}{" "}
                    {formatMoney(Math.abs(m.delta), currency, { cents: false })}
                  </span>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}
    </>
  );
}
