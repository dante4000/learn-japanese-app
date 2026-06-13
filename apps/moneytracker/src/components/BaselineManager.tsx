"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RecurringBaseline } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { formatMoney, formatMonth } from "@/lib/format";

// Manage fixed monthly baselines (e.g. rent + parking) the bank feed misses.
export function BaselineManager({
  baselines,
  currency = "USD",
}: {
  baselines: RecurringBaseline[];
  currency?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("RENT_AND_UTILITIES");
  const [startMonth, setStartMonth] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !amount || !/^\d{4}-\d{2}$/.test(startMonth)) return;
    setBusy(true);
    await fetch("/api/baseline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amount: Number(amount), category, startMonth }),
    });
    setBusy(false);
    setOpen(false);
    setName("");
    setAmount("");
    setStartMonth("");
    router.refresh();
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch(`/api/baseline?id=${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  const field =
    "rounded-xl border hairline bg-surface px-3 py-2.5 text-sm text-cream outline-none placeholder:text-faint focus:border-blue";

  return (
    <div>
      {baselines.length > 0 && (
        <ul className="mb-3 space-y-2">
          {baselines.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-3 rounded-xl border hairline bg-surface px-4 py-2.5 text-sm"
            >
              <span className="text-cream">{b.name}</span>
              <span className="text-xs text-faint">
                since {formatMonth(b.startMonth)}
              </span>
              <span className="tnum ml-auto text-cream">
                {formatMoney(b.amount, currency, { cents: false })}/mo
              </span>
              <button
                onClick={() => remove(b.id)}
                disabled={busy}
                className="text-faint hover:text-coral"
                aria-label="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <form onSubmit={add} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rent & Parking"
            className={`${field} col-span-2 sm:col-span-1`}
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="Amount/mo"
            className={`${field} tnum`}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={field}
          >
            {Object.values(CATEGORIES)
              .filter((c) => c.isSpending && c.key !== "OTHER")
              .map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
          </select>
          <input
            value={startMonth}
            onChange={(e) => setStartMonth(e.target.value)}
            placeholder="2024-06"
            pattern="\d{4}-\d{2}"
            className={`${field} tnum`}
          />
          <div className="col-span-2 flex gap-2 sm:col-span-4">
            <button
              type="submit"
              disabled={busy || !name || !amount || !/^\d{4}-\d{2}$/.test(startMonth)}
              className="rounded-xl bg-blue px-4 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Add baseline
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2 text-sm text-faint hover:text-cream"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl border border-dashed hairline px-4 py-2.5 text-sm text-cream-dim transition-colors hover:border-line-2"
        >
          + Add a fixed monthly bill (fills months the bank feed misses)
        </button>
      )}
    </div>
  );
}
