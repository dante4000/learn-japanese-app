"use client";

import { useLoadingStatus } from "./LoadingFeedback";

import Link from "@/components/AppLink";
import { isSyntheticBaseline } from "@/lib/analytics";
import { useState } from "react";
import { useSavedRefresh } from "@/components/useSavedRefresh";
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
  const { savedMessage, clearSavedFeedback, refreshAfterSave } = useSavedRefresh();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [busy, setBusy] = useState(false);
  useLoadingStatus(busy, "Saving transaction…");
  const [error, setError] = useState<string | null>(null);

  function openEditor(t: Transaction) {
    const next = editingId === t.id ? null : t.id;
    setEditingId(next);
    setNoteDraft(next ? (t.note ?? "") : "");
  }

  async function update(id: string, patch: Record<string, unknown>) {
    clearSavedFeedback();
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
      refreshAfterSave();
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
    savedMessage,
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
  possibleDuplicate = false,
}: {
  t: Transaction;
  accountName?: string;
  currency: string;
  editor: TransactionEditor;
  possibleDuplicate?: boolean;
}) {
  const meta = categoryMeta(resolveCategoryKey(t));
  const synthetic = isSyntheticBaseline(t);
  const open = !synthetic && editor.editingId === t.id;
  const { busy, noteDraft, setNoteDraft, update, openEditor } = editor;

  return (
    <li className="px-3 sm:px-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 py-3 sm:flex">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border hairline bg-surface-2">
          {meta.glyph}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 max-w-full truncate text-sm text-cream">
              {displayPayee(t.merchantName, t.name, accountName)}
            </span>
            {possibleDuplicate && <span className="rounded bg-coral/10 px-1.5 py-0.5 text-xs text-coral">Possible duplicate</span>}
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
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-faint">
            <span>{formatDate(t.date)}</span>
            <span>·</span>
            {synthetic ? <Link href="/recurring" className="inline-flex min-h-11 items-center text-blue">Edit estimate</Link> : <button
              disabled={busy}
              aria-expanded={open}
              aria-label={`Edit ${displayPayee(t.merchantName, t.name, accountName)}`}
              onClick={() => openEditor(t)}
              className="min-h-11 lg:min-h-0 hover:text-blue"
              style={{ color: meta.color }}
            >
              {meta.label} · Edit
            </button>}
            {accountName && (
              <>
                <span>·</span>
                <span className="min-w-0 max-w-full truncate">{accountName}</span>
              </>
            )}
          </div>
        </div>
        <span
          className={`tnum col-start-2 justify-self-end shrink-0 text-sm ${t.amount < 0 ? "text-blue" : "text-cream"}`}
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
                  aria-pressed={resolveCategoryKey(t) === c.key}
                  disabled={busy}
                  onClick={() => update(t.id, { userCategory: c.key })}
                  className="min-h-11 lg:min-h-0 rounded-lg border hairline px-2.5 py-1 text-xs text-cream-dim transition-colors hover:border-line-2"
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
              aria-label="Transaction note"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Add a note — why, who, what for…"
              className="min-w-0 w-full flex-auto sm:min-w-48 sm:flex-1 rounded-lg border hairline bg-surface px-3 py-1.5 text-base sm:text-xs text-cream outline-none placeholder:text-faint focus:border-blue"
            />
            <button
              disabled={busy || noteDraft === (t.note ?? "")}
              onClick={() => update(t.id, { note: noteDraft.trim() || null })}
              className="min-h-11 lg:min-h-0 rounded-lg bg-blue px-3 py-1.5 text-xs font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Save note
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() => update(t.id, { hidden: !t.hidden })}
              className="min-h-11 lg:min-h-0 rounded-lg border hairline px-3 py-1.5 text-xs text-cream-dim hover:border-line-2"
            >
              {t.hidden ? "Unhide" : "Hide from analytics"}
            </button>
            {t.userCategory && (
              <button
                disabled={busy}
                onClick={() => update(t.id, { userCategory: null })}
                className="min-h-11 lg:min-h-0 rounded-lg px-3 py-1.5 text-xs text-faint hover:text-coral"
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
