"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Account, Transaction } from "@/lib/types";
import { CATEGORIES, categoryMeta, resolveCategoryKey } from "@/lib/categories";
import { formatMoney, formatDate, monthKey } from "@/lib/format";
import { displayPayee } from "@/lib/aliases";

export function TransactionsView({
  transactions,
  accounts,
  currency,
  initial,
}: {
  transactions: Transaction[];
  accounts: Account[];
  currency: string;
  /** Pre-applied filters from URL params, so links from charts/rows land filtered. */
  initial?: { q?: string; category?: string; account?: string };
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial?.q ?? "");
  const [cat, setCat] = useState(initial?.category ?? "ALL");
  const [acct, setAcct] = useState(initial?.account ?? "ALL");
  const [editing, setEditing] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acctName = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return transactions.filter((t) => {
      if (cat !== "ALL" && resolveCategoryKey(t) !== cat) return false;
      if (acct !== "ALL" && t.accountId !== acct) return false;
      if (needle) {
        const hay = `${t.name} ${t.merchantName ?? ""} ${displayPayee(t.merchantName, t.name)} ${t.note ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [transactions, q, cat, acct]);

  const filteredTotal = useMemo(
    () => filtered.reduce((a, t) => (t.amount > 0 ? a + t.amount : a), 0),
    [filtered],
  );

  // group by month
  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const k = monthKey(t.date);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return [...map.entries()];
  }, [filtered]);

  const hasFilter = q.trim() !== "" || cat !== "ALL" || acct !== "ALL";

  function openEditor(t: Transaction) {
    const next = editing === t.id ? null : t.id;
    setEditing(next);
    setNoteDraft(next ? (t.note ?? "") : "");
  }

  function clearFilters() {
    setQ("");
    setCat("ALL");
    setAcct("ALL");
  }

  async function update(id: string, patch: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/transactions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Could not save change");
        return;
      }
      setEditing(null);
      router.refresh();
    } catch {
      setError("Could not save change");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-5 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, merchant, or note…"
          className="min-w-40 flex-1 rounded-xl border hairline bg-surface px-4 py-2.5 text-sm text-cream outline-none placeholder:text-faint focus:border-blue"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="rounded-xl border hairline bg-surface px-3 py-2.5 text-sm text-cream outline-none focus:border-blue"
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
            value={acct}
            onChange={(e) => setAcct(e.target.value)}
            className="rounded-xl border hairline bg-surface px-3 py-2.5 text-sm text-cream outline-none focus:border-blue"
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

      {/* Active-filter summary */}
      {hasFilter && (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted">
            {filtered.length} match{filtered.length === 1 ? "" : "es"}
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
            className="rounded-lg border hairline px-2.5 py-1 text-xs text-cream-dim hover:border-line-2"
          >
            Clear filters
          </button>
        </div>
      )}

      {error && (
        <p className="mb-3 text-sm text-coral" role="alert">
          {error}
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
              <span className="label-eyebrow">{m}</span>
              <span className="tnum text-xs text-faint">
                {items.length} items
              </span>
            </div>
            <ul className="divide-y divide-[var(--color-line)]">
              {items.map((t) => {
                const meta = categoryMeta(resolveCategoryKey(t));
                const open = editing === t.id;
                return (
                  <li key={t.id} className="px-4">
                    <div className="flex items-center gap-3 py-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border hairline bg-surface-2">
                        {meta.glyph}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm text-cream">
                            {displayPayee(t.merchantName, t.name)}
                          </span>
                          {t.note && (
                            <span
                              title={t.note}
                              className="rounded bg-blue/15 px-1.5 py-0.5 text-[0.6rem] text-blue"
                            >
                              ✎ note
                            </span>
                          )}
                          {t.hidden && (
                            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.6rem] text-faint">
                              hidden
                            </span>
                          )}
                          {t.pending && (
                            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.6rem] text-slate-soft">
                              pending
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-faint">
                          <span>{formatDate(t.date)}</span>
                          <span>·</span>
                          <button
                            onClick={() => openEditor(t)}
                            className="hover:text-blue"
                            style={{ color: meta.color }}
                          >
                            {meta.label}
                          </button>
                          {acctName.get(t.accountId) && (
                            <>
                              <span>·</span>
                              <span className="truncate">
                                {acctName.get(t.accountId)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span
                        className={`tnum text-sm ${t.amount < 0 ? "text-blue" : "text-cream"}`}
                      >
                        {formatMoney(-t.amount, currency, { sign: true })}
                      </span>
                    </div>

                    {open && (
                      <div className="mb-3 rounded-xl border hairline bg-ink p-3">
                        <div className="label-eyebrow mb-2">Recategorize</div>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.values(CATEGORIES)
                            .filter((c) => c.key !== "OTHER")
                            .map((c) => (
                              <button
                                key={c.key}
                                disabled={busy}
                                onClick={() => update(t.id, { userCategory: c.key })}
                                className="rounded-lg border hairline px-2.5 py-1 text-xs text-cream-dim transition-colors hover:border-line-2"
                                style={{
                                  borderColor:
                                    resolveCategoryKey(t) === c.key
                                      ? c.color
                                      : undefined,
                                }}
                              >
                                {c.glyph} {c.label}
                              </button>
                            ))}
                        </div>

                        <div className="label-eyebrow mb-2 mt-4">Note</div>
                        <div className="flex flex-wrap gap-2">
                          <input
                            value={noteDraft}
                            onChange={(e) => setNoteDraft(e.target.value)}
                            placeholder="Add a note — why, who, what for…"
                            className="min-w-48 flex-1 rounded-lg border hairline bg-surface px-3 py-1.5 text-xs text-cream outline-none placeholder:text-faint focus:border-blue"
                          />
                          <button
                            disabled={busy || noteDraft === (t.note ?? "")}
                            onClick={() =>
                              update(t.id, { note: noteDraft.trim() || null })
                            }
                            className="rounded-lg bg-blue px-3 py-1.5 text-xs font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
                          >
                            Save note
                          </button>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            disabled={busy}
                            onClick={() => update(t.id, { hidden: !t.hidden })}
                            className="rounded-lg border hairline px-3 py-1.5 text-xs text-cream-dim hover:border-line-2"
                          >
                            {t.hidden ? "Unhide" : "Hide from analytics"}
                          </button>
                          {t.userCategory && (
                            <button
                              disabled={busy}
                              onClick={() => update(t.id, { userCategory: null })}
                              className="rounded-lg px-3 py-1.5 text-xs text-faint hover:text-coral"
                            >
                              Reset category
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
