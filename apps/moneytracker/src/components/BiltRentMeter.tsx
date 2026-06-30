"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";

/** Serializable view of resolveBiltMeter() — the page computes it server-side. */
export interface BiltMeterView {
  housingPayment: number;
  everydaySpend: number;
  statementDay: number;
  housingFromOverride: boolean;
  cycleLabel: string;
  currency: string;
  rewards: {
    ratio: number;
    multiplier: number;
    points: number;
    maxed: boolean;
    nextMultiplier: number | null;
    toNext: number | null;
  };
}

const TICKS = [0.25, 0.5, 0.75, 1.0];

function mult(m: number): string {
  return `${m % 1 === 0 ? m.toFixed(0) : m}×`;
}

export function BiltRentMeter({ meter, delay = 0 }: { meter: BiltMeterView; delay?: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [housing, setHousing] = useState(
    meter.housingPayment ? String(meter.housingPayment) : "",
  );
  const [day, setDay] = useState(String(meter.statementDay));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { rewards, currency } = meter;
  const pct = Math.min(1, Math.max(0, rewards.ratio)) * 100;
  const noHousing = meter.housingPayment <= 0;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bilt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          housingOverride: housing.trim() === "" ? null : Number(housing),
          statementDay: Number(day),
        }),
      });
      if (!res.ok) {
        setError((await res.json().catch(() => ({})))?.error ?? "Could not save");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="card rise p-5 md:p-6 mt-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="flex items-start justify-between">
        <div>
          <div className="label-eyebrow">Bilt rent rewards</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-4xl tracking-tight text-cream">
              {noHousing ? "—" : `${rewards.points.toLocaleString()} pts`}
            </span>
          </div>
          {!noHousing && (
            <div className="mt-1 text-sm text-blue">
              {rewards.multiplier === 0
                ? "Below 0.5× — earning the 250 pt floor"
                : `Earning ${mult(rewards.multiplier)} on rent`}
            </div>
          )}
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          aria-label="Edit housing payment and statement cycle"
          className="hairline rounded-lg bg-surface px-2.5 py-1 text-xs text-muted hover:text-cream"
        >
          {editing ? "Close" : "Edit"}
        </button>
      </header>

      {noHousing ? (
        <p className="mt-4 text-sm text-muted">
          Set your monthly housing payment to track how much everyday spend you
          need to unlock the 1.25× rent multiplier.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between text-sm">
            <div>
              <div className="text-muted">Everyday spend</div>
              <div className="tnum mt-0.5 text-lg text-cream">
                {formatMoney(meter.everydaySpend, currency)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted">Housing payment</div>
              <div className="tnum mt-0.5 text-lg text-cream">
                {formatMoney(meter.housingPayment, currency, { cents: false })}
              </div>
            </div>
          </div>

          {/* Progress toward the next tier, with ticks at 25/50/75/100% */}
          <div className="relative mt-4 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-blue transition-[width]"
              style={{ width: `${pct}%` }}
            />
            {TICKS.slice(0, 3).map((t) => (
              <span
                key={t}
                className="absolute top-0 h-full w-px bg-ink/40"
                style={{ left: `${t * 100}%` }}
              />
            ))}
          </div>

          <p className="mt-3 text-sm text-muted">
            {rewards.maxed ? (
              <span className="text-blue">
                Maxed at 1.25× — extra everyday spend won’t add rent points.
              </span>
            ) : (
              <>
                You’re{" "}
                <span className="tnum text-cream">
                  {formatMoney(rewards.toNext ?? 0, currency)}
                </span>{" "}
                away from {mult(rewards.nextMultiplier ?? 0.5)} on housing.
              </>
            )}
          </p>

          <p className="mt-1 text-xs text-muted">
            Statement {meter.cycleLabel} · resets each cycle.
            {meter.housingFromOverride ? "" : " Housing from your rent baseline."}
          </p>
        </>
      )}

      {editing && (
        <form onSubmit={save} className="mt-4 grid grid-cols-2 gap-2 border-t border-ink/30 pt-4">
          <label className="text-xs text-muted">
            Housing payment
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={housing}
              onChange={(e) => setHousing(e.target.value)}
              placeholder="from rent baseline"
              className="hairline mt-1 w-full rounded-lg bg-surface px-2.5 py-1.5 text-sm text-cream"
            />
          </label>
          <label className="text-xs text-muted">
            Cycle start day (1–28)
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="28"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="hairline mt-1 w-full rounded-lg bg-surface px-2.5 py-1.5 text-sm text-cream"
            />
          </label>
          {error && <p className="col-span-2 text-xs text-coral">{error}</p>}
          <div className="col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg border border-blue/40 bg-blue/15 px-3 py-1.5 text-sm text-blue disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
