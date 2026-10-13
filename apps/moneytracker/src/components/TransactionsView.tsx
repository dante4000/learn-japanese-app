"use client";

import { useMemo, useState } from "react";
import { Account, Transaction } from "@/lib/types";
import { CATEGORIES, resolveCategoryKey } from "@/lib/categories";
import { formatMoney, formatMonth, formatDate, monthKey } from "@/lib/format";
import { displayPayee } from "@/lib/aliases";
import { DuplicateGroup, isSpend } from "@/lib/analytics";
import { DuplicateCharges } from "@/components/DuplicateCharges";
import { TransactionRow, useTransactionEditor } from "@/components/TransactionRow";

export function TransactionsView({
  transactions,
  accounts,
  currency,
  initial,
  duplicateGroups = [],
}: {
  transactions: Transaction[];
  accounts: Account[];
  currency: string;
  duplicateGroups?: DuplicateGroup[];
  /** Pre-applied filters from URL params, so links from charts/rows land filtered. */
  initial?: { q?: string; category?: string; account?: string; month?: string };
}) {
  const [q, setQ] = useState(initial?.q ?? "");
  const [cat, setCat] = useState(initial?.category ?? "ALL");
  const [acct, setAcct] = useState(initial?.account ?? "ALL");
  const [month, setMonth] = useState(initial?.month ?? "ALL");
  const editor = useTransactionEditor();
  const [reviewIds, setReviewIds] = useState<string[] | null>(null);
  const [limit, setLimit] = useState(100);
  const possibleDuplicateIds = useMemo(() => new Set(duplicateGroups.flatMap((group) => group.transactions.map((t) => t.id))), [duplicateGroups]);
  function resetView() { setReviewIds(null); setLimit(100); }

  const acctName = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return transactions.filter((t) => {
      if (cat !== "ALL" && resolveCategoryKey(t) !== cat) return false;
      if (acct !== "ALL" && t.accountId !== acct) return false;
      if (month !== "ALL" && monthKey(t.date) !== month) return false;
      if (needle) {
        const hay = `${t.name} ${t.merchantName ?? ""} ${displayPayee(t.merchantName, t.name, acctName.get(t.accountId))} ${t.note ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [transactions, q, cat, acct, month, acctName]);

  const filteredIds = useMemo(() => new Set(filtered.map((t) => t.id)), [filtered]);
  const reviewing = reviewIds ? transactions.filter((t) => reviewIds.includes(t.id)) : filtered;
  const filteredTotal = useMemo(
    () => reviewing.reduce((a, t) => isSpend(t) ? a + t.amount : a, 0),
    [reviewing],
  );

  // group by month
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of reviewing.slice(0, limit)) {
      const k = monthKey(t.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return [...map.entries()];
  }, [reviewing, limit]);

  const hasFilter =
    q.trim() !== "" || cat !== "ALL" || acct !== "ALL" || month !== "ALL" || reviewIds !== null;

  function clearFilters() {
    resetView();
    setQ("");
    setCat("ALL");
    setAcct("ALL");
    setMonth("ALL");
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-5 flex flex-wrap gap-2">
        <input
          aria-label="Search transactions"
          value={q}
          onChange={(e) => { setQ(e.target.value); resetView(); }}
          placeholder="Search name, merchant, or note…"
          className="min-w-0 w-full flex-auto sm:min-w-40 sm:flex-1 rounded-xl border hairline bg-surface px-4 py-2.5 text-base sm:text-sm text-cream outline-none placeholder:text-faint focus:border-blue"
        />
        <select
          aria-label="Category"
          value={cat}
          onChange={(e) => { setCat(e.target.value); resetView(); }}
          className="min-w-0 max-w-full w-full sm:w-auto rounded-xl border hairline bg-surface px-3 py-2.5 text-base sm:text-sm text-cream outline-none focus:border-blue"
        >
          <option value="ALL">All categories</option>
          {Object.values(CATEGORIES).map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        {accounts.length > 1 && (
          <select
            aria-label="Account"
            value={acct}
            onChange={(e) => { setAcct(e.target.value); resetView(); }}
            className="min-w-0 max-w-full w-full sm:w-auto rounded-xl border hairline bg-surface px-3 py-2.5 text-base sm:text-sm text-cream outline-none focus:border-blue"
          >
            <option value="ALL">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <DuplicateCharges
        groups={duplicateGroups.filter((group) => group.transactions.some((t) => filteredIds.has(t.id)))}
        accountNames={acctName}
        currency={currency}
        onReview={(ids) => {
          setQ(""); setCat("ALL"); setAcct("ALL"); setMonth("ALL");
          setReviewIds(ids); setLimit(100);
        }}
      />
      {reviewIds && <p role="status" className="mb-3 text-sm text-muted">Reviewing {reviewing.length} exact candidate charges across all dates{reviewing.length ? ` (${formatDate(reviewing[reviewing.length - 1].date)} – ${formatDate(reviewing[0].date)})` : ""}. Search, category, account, and month filters were cleared for this review. Clear filters to return to all transactions.</p>}

      {/* Active-filter summary */}
      {hasFilter && (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          {month !== "ALL" && (
            <button
              onClick={() => { setMonth("ALL"); resetView(); }}
              className="min-h-11 lg:min-h-0 flex items-center gap-1.5 rounded-lg border border-blue/40 bg-blue/15 px-2.5 py-1 text-xs text-blue"
            >
              {formatMonth(month)}
              <span aria-hidden>✕</span>
            </button>
          )}
          <span className="text-muted">
            {reviewing.length} match{reviewing.length === 1 ? "" : "es"}
            {filteredTotal > 0 && (
              <>
                {" · "}
                <span className="tnum text-cream">
                  {formatMoney(filteredTotal, currency, { cents: false })}
                </span>{" "}
                spent
              </>
            )}
          </span>
          <button
            onClick={clearFilters}
            className="min-h-11 lg:min-h-0 rounded-lg border hairline px-2.5 py-1 text-xs text-cream-dim hover:border-line-2"
          >
            Clear filters
          </button>
        </div>
      )}

      {editor.error && (
        <p className="mb-3 text-sm text-coral" role="alert">
          {editor.error}
        </p>
      )}

      <div className="card overflow-hidden">
        {groups.length === 0 && (
          <p className="py-16 text-center text-sm text-muted">
            No transactions match.
          </p>
        )}
        {groups.map(([m, items]) => (
          <div key={m}>
            <div className="sticky top-0 z-10 flex items-center justify-between bg-ink-2/95 px-5 py-2.5 backdrop-blur">
              <span className="label-eyebrow">{formatMonth(m)}</span>
              <span className="tnum text-xs text-faint">
                {items.length} shown
              </span>
            </div>
            <ul className="divide-y divide-[var(--color-line)]">
              {items.map((t) => (
                <TransactionRow
                  key={t.id}
                  t={t}
                  accountName={acctName.get(t.accountId)}
                  currency={currency}
                  editor={editor}
                  possibleDuplicate={possibleDuplicateIds.has(t.id)}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
      {reviewing.length > limit && (
        <button type="button" onClick={() => setLimit((value) => value + 100)} className="mt-4 min-h-11 rounded-xl border hairline px-4 py-2 text-sm text-cream">
          Load 100 more · {Math.min(limit, reviewing.length)} of {reviewing.length} shown
        </button>
      )}
    </div>
  );
}
