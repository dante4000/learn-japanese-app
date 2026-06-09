"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Account, Transaction } from "@/lib/types";
import { CATEGORIES, categoryMeta } from "@/lib/categories";
import { formatMoney, formatDate, monthKey } from "@/lib/format";

export function TransactionsView({
  transactions,
  accounts,
  currency,
}: {
  transactions: Transaction[];
  accounts: Account[];
  currency: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ALL");
  const [acct, setAcct] = useState("ALL");
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const acctName = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return transactions.filter((t) => {
      if (cat !== "ALL" && (t.userCategory || t.categoryPrimary) !== cat)
        return false;
      if (acct !== "ALL" && t.accountId !== acct) return false;
      if (needle) {
        const hay = `${t.name} ${t.merchantName ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [transactions, q, cat, acct]);

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

  async function update(id: string, patch: Record<string, unknown>) {
    setBusy(true);
    await fetch("/api/transactions/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    setBusy(false);
    setEditing(null);
    router.refresh();
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-5 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search merchants…"
          className="min-w-40 flex-1 rounded-xl border hairline bg-surface px-4 py-2.5 text-sm text-cream outline-none placeholder:text-faint focus:border-emerald"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="rounded-xl border hairline bg-surface px-3 py-2.5 text-sm text-cream outline-none focus:border-emerald"
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
            className="rounded-xl border hairline bg-surface px-3 py-2.5 text-sm text-cream outline-none focus:border-emerald"
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
                const meta = categoryMeta(t.userCategory || t.categoryPrimary);
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
                            {t.merchantName || t.name}
                          </span>
                          {t.hidden && (
                            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.6rem] text-faint">
                              hidden
                            </span>
                          )}
                          {t.pending && (
                            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.6rem] text-gold-soft">
                              pending
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-faint">
                          <span>{formatDate(t.date)}</span>
                          <span>·</span>
                          <button
                            onClick={() => setEditing(open ? null : t.id)}
                            className="hover:text-emerald"
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
                        className={`tnum text-sm ${t.amount < 0 ? "text-emerald" : "text-cream"}`}
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
                                    (t.userCategory || t.categoryPrimary) === c.key
                                      ? c.color
                                      : undefined,
                                }}
                              >
                                {c.glyph} {c.label}
                              </button>
                            ))}
                        </div>
                        <div className="mt-3 flex gap-2">
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
