"use client";

import { useState } from "react";
import Link from "next/link";
import { CategoryDetailData } from "@/lib/analytics";
import { RecurringFrequency } from "@/lib/types";
import { formatMoney, formatMonth, formatDate } from "@/lib/format";
import { displayPayee } from "@/lib/aliases";
import { MonthPicker } from "@/components/MonthPicker";
import {
  TransactionRow,
  useTransactionEditor,
} from "@/components/TransactionRow";

// Rough occurrences-per-month, to normalize a recurring charge to a monthly cost.
const PER_MONTH: Record<RecurringFrequency, number> = {
  WEEKLY: 52 / 12,
  BIWEEKLY: 26 / 12,
  SEMI_MONTHLY: 2,
  MONTHLY: 1,
  ANNUALLY: 1 / 12,
  UNKNOWN: 1,
};

/** Up = more spending = coral (bad); down = blue (good). Mirrors Spending tab. */
function Delta({ pct }: { pct: number | null }) {
  if (pct == null) return null;
  const down = pct <= 0;
  return (
    <span className={`tnum text-xs ${down ? "text-blue" : "text-coral"}`}>
      {down ? "▼" : "▲"} {Math.abs(Math.round(pct))}%
    </span>
  );
}

export function CategoryDetail({
  data,
  currency,
  months,
  accountNames,
}: {
  data: CategoryDetailData;
  currency: string;
  months: string[];
  accountNames: Record<string, string>;
}) {
  const editor = useTransactionEditor();
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (name: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const acctName = (id: string) => accountNames[id];

  const header = (
    <div className="mb-5 flex items-end justify-between gap-3">
      <Link
        href={`/spending?month=${data.month}`}
        className="text-sm text-muted transition-colors hover:text-cream"
      >
        ← Spending
      </Link>
      {months.length > 1 && <MonthPicker months={months} selected={data.month} />}
    </div>
  );

  if (data.count === 0) {
    return (
      <div>
        {header}
        <div className="card rise grid place-items-center px-6 py-20 text-center">
          <span className="mb-4 text-4xl">{data.glyph}</span>
          <h2 className="font-display text-2xl text-cream">{data.label}</h2>
          <p className="mt-2 text-sm text-muted">
            Nothing in {data.label} for {formatMonth(data.month)}.
          </p>
        </div>
      </div>
    );
  }

  const overAvg = data.vsAvgPct != null && data.vsAvgPct > 0;

  return (
    <div>
      {header}

      {/* Summary hero */}
      <section
        className="card rise relative overflow-hidden p-6 md:p-7"
        style={{ borderTop: `3px solid ${data.color}` }}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl border hairline bg-surface-2 text-2xl">
            {data.glyph}
          </span>
          <div>
            <div className="label-eyebrow">{formatMonth(data.month)}</div>
            <h1 className="font-display text-2xl tracking-tight text-cream">
              {data.label}
            </h1>
          </div>
        </div>

        <div className="tnum mt-4 font-display text-5xl tracking-tight text-cream">
          {formatMoney(data.total, currency, { cents: false })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
          {data.deltaPct != null && (
            <span className="flex items-center gap-1.5">
              <Delta pct={data.deltaPct} />
              <span className="text-muted">
                vs {data.prevMonth ? formatMonth(data.prevMonth) : "last month"}
              </span>
            </span>
          )}
          {data.vsAvgPct != null && (
            <span className={overAvg ? "text-coral" : "text-blue"}>
              {overAvg ? "+" : "−"}
              {Math.abs(Math.round(data.vsAvgPct))}%{" "}
              <span className="text-muted">vs your average</span>
            </span>
          )}
          <span className="text-cream-dim">
            {Math.round(data.shareOfMonth * 100)}%{" "}
            <span className="text-muted">of this month&apos;s spend</span>
          </span>
          <span className="text-cream-dim">
            {data.count} <span className="text-muted">charges</span>
          </span>
        </div>
      </section>

      {/* Recurring — the easy cuts */}
      {data.recurring.length > 0 && (
        <section
          className="card rise mt-4 p-5 md:p-6"
          style={{ animationDelay: "60ms" }}
        >
          <header className="mb-1 flex items-baseline justify-between">
            <h2 className="font-display text-lg tracking-tight text-cream">
              Recurring here
            </h2>
            <span className="text-xs text-muted">usually the easiest to cut</span>
          </header>
          <ul className="mt-3 space-y-2">
            {data.recurring.map((s) => {
              const monthly = s.averageAmount * PER_MONTH[s.frequency];
              return (
                <li
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl border hairline bg-surface px-3 py-2.5"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border hairline bg-surface-2 text-sm">
                    🔁
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm text-cream">
                      {s.merchantName || s.description}
                    </div>
                    <div className="text-xs text-faint">
                      <span className="capitalize">
                        {s.frequency.toLowerCase().replace("_", " ")}
                      </span>
                      {s.predictedNextDate
                        ? ` · next ${formatDate(s.predictedNextDate)}`
                        : ""}
                    </div>
                  </div>
                  <span className="ml-auto text-right">
                    <span className="tnum block text-sm text-cream">
                      {formatMoney(s.averageAmount, currency)}
                    </span>
                    <span className="tnum text-[0.65rem] text-faint">
                      ≈ {formatMoney(monthly, currency, { cents: false })}/mo
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* By merchant — the primary, organized list */}
      <section
        className="card rise mt-4 p-5 md:p-6"
        style={{ animationDelay: "120ms" }}
      >
        <header className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg tracking-tight text-cream">
            By merchant
          </h2>
          <span className="text-xs text-muted">{data.merchants.length} merchants</span>
        </header>

        <ul className="space-y-2.5">
          {data.merchants.map((mch) => {
            const share = data.total ? (mch.total / data.total) * 100 : 0;
            const isOpen = open.has(mch.name);
            return (
              <li
                key={mch.name}
                className="overflow-hidden rounded-xl border hairline bg-surface"
              >
                <button
                  onClick={() => toggle(mch.name)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
                >
                  <svg
                    className={`shrink-0 text-faint transition-transform ${isOpen ? "rotate-90" : ""}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm text-cream">
                        {mch.name}
                      </span>
                      <span className="text-xs text-faint">· {mch.count}×</span>
                      <Delta pct={mch.deltaPct} />
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${share}%`, background: data.color }}
                      />
                    </div>
                  </div>
                  <span className="tnum shrink-0 text-sm text-cream">
                    {formatMoney(mch.total, currency, { cents: false })}
                  </span>
                </button>

                {isOpen && (
                  <ul className="divide-y divide-[var(--color-line)] border-t border-[var(--color-line)] bg-ink-2/40">
                    {mch.transactions.map((t) => (
                      <TransactionRow
                        key={t.id}
                        t={t}
                        accountName={acctName(t.accountId)}
                        currency={currency}
                        editor={editor}
                      />
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        {editor.error && (
          <p className="mt-3 text-sm text-coral" role="alert">
            {editor.error}
          </p>
        )}
      </section>

      {/* Biggest single charges */}
      {data.biggest.length > 0 && (
        <section
          className="card rise mt-4 p-5 md:p-6"
          style={{ animationDelay: "180ms" }}
        >
          <header className="mb-4">
            <h2 className="font-display text-lg tracking-tight text-cream">
              Biggest charges
            </h2>
          </header>
          <ul className="space-y-2">
            {data.biggest.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-xl border hairline bg-surface px-3 py-2.5"
              >
                <span className="tnum w-20 shrink-0 text-sm text-cream">
                  {formatMoney(t.amount, currency, { cents: false })}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-cream-dim">
                  {displayPayee(t.merchantName, t.name, acctName(t.accountId))}
                </span>
                <span className="shrink-0 text-xs text-faint">
                  {formatDate(t.date)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Escape hatch to the raw searchable ledger */}
      <div className="mt-4 text-center">
        <Link
          href={`/transactions?category=${encodeURIComponent(data.category)}&month=${data.month}`}
          className="text-sm text-blue hover:underline"
        >
          Open in Activity →
        </Link>
      </div>
    </div>
  );
}
