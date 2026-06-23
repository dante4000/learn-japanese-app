"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Transaction } from "@/lib/types";
import { CATEGORIES, categoryMeta, resolveCategoryKey } from "@/lib/categories";
import { formatMoney, formatDate } from "@/lib/format";
import { displayPayee } from "@/lib/aliases";

/**
 * Shared editing state for a list of transaction rows: which row's panel is
 * open, the draft note, and the persist call. Hoisted into one hook so only a
 * single row is ever open and both the Activity ledger and the category
 * drill-down edit transactions exactly the same way.
 */
export function useTransactionEditor() {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openEditor(t: Transaction) {
    const next = editingId === t.id ? null : t.id;
    setEditingId(next);
    setNoteDraft(next ? (t.note ?? "") : "");
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
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Could not save change");
    } finally {
      setBusy(false);
    }
  }

  return {
    editingId,
    noteDraft,
    setNoteDraft,
    busy,
    error,
    openEditor,
    update,
  };
}

export type TransactionEditor = ReturnType<typeof useTransactionEditor>;

/** One ledger row plus its inline recategorize / note / hide editor. */
export function TransactionRow({
  t,
  accountName,
  currency,
  editor,
}: {
  t: Transaction;
  accountName?: string;
  currency: string;
  editor: TransactionEditor;
}) {
  const meta = categoryMeta(resolveCategoryKey(t));
  const open = editor.editingId === t.id;
  const { busy, noteDraft, setNoteDraft, update, openEditor } = editor;

  return (
    <li className="px-4">
      <div className="flex items-center gap-3 py-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border hairline bg-surface-2">
          {meta.glyph}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm text-cream">
              {displayPayee(t.merchantName, t.name, accountName)}
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
            {accountName && (
              <>
                <span>·</span>
                <span className="truncate">{accountName}</span>
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
                      resolveCategoryKey(t) === c.key ? c.color : undefined,
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
              onClick={() => update(t.id, { note: noteDraft.trim() || null })}
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
}
