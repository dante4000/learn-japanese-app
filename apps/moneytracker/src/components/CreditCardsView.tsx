"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CardCatalogEntry,
  CardCredit,
  maxCreditsValue,
} from "@/lib/cards";
import { formatMoney } from "@/lib/format";

// Live per-card data computed server-side from the user's real transactions.
export interface CardLive {
  accountName: string;
  mask: string | null;
  balance: number | null;
  limit: number | null;
  spend12mo: number;
  spendYtd: number;
  txnCount: number;
  estPoints: number;
  estPointsValue: number;
}

export interface CardViewData {
  card: CardCatalogEntry;
  live: CardLive | null;
}

interface UnmatchedAccount {
  name: string;
  mask: string | null;
  balance: number | null;
}

const STORAGE_KEY = "mt.cardperks.v2";

type UsageMap = Record<string, Record<string, boolean>>;

/** Default "do you use this credit" state: on if the realistic capture rate ≥ 0.5. */
function defaultUsage(cards: CardViewData[]): UsageMap {
  const map: UsageMap = {};
  for (const { card } of cards) {
    map[card.cardKey] = {};
    for (const c of card.credits) {
      map[card.cardKey][c.name] = c.realisticCaptureRate >= 0.5;
    }
  }
  return map;
}

const accentText: Record<string, string> = {
  blue: "text-blue",
  coral: "text-coral",
  slate: "text-slate",
};
const accentBg: Record<string, string> = {
  blue: "bg-blue",
  coral: "bg-coral",
  slate: "bg-slate",
};

function freqLabel(f: CardCredit["frequency"]): string {
  switch (f) {
    case "monthly":
      return "monthly";
    case "quarterly":
      return "quarterly";
    case "semiannual":
      return "twice a year";
    case "every-4-years":
      return "every 4 yrs";
    case "one-time":
      return "one-time";
    default:
      return "annual";
  }
}

/** Monthly/quarterly credits are the ones people forget — flag them. */
function isForgettable(f: CardCredit["frequency"]): boolean {
  return f === "monthly" || f === "quarterly" || f === "semiannual";
}

export function CreditCardsView({
  cards,
  unmatched,
  currency,
}: {
  cards: CardViewData[];
  unmatched: UnmatchedAccount[];
  currency: string;
}) {
  const [usage, setUsage] = useState<UsageMap>(() => defaultUsage(cards));
  const [hydrated, setHydrated] = useState(false);

  // Load saved toggles after mount. We intentionally render the catalog
  // defaults on the server + first client paint, then sync in the user's saved
  // selections from localStorage (a browser-only source) — the sanctioned
  // pattern for hydrating from external storage without a mismatch.
  useEffect(() => {
    let saved: UsageMap | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw) as UsageMap;
    } catch {
      /* ignore corrupt storage */
    }
    if (saved) {
      const merged: UsageMap = {};
      for (const k of Object.keys(usage)) {
        merged[k] = { ...usage[k], ...(saved[k] ?? {}) };
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsage(merged);
    }
    setHydrated(true);
    // run once on mount; `usage` here is the freshly-built default map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(cardKey: string, creditName: string) {
    setUsage((prev) => {
      const next: UsageMap = {
        ...prev,
        [cardKey]: { ...prev[cardKey], [creditName]: !prev[cardKey]?.[creditName] },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function resetCard(cardKey: string) {
    setUsage((prev) => {
      const card = cards.find((c) => c.card.cardKey === cardKey)?.card;
      if (!card) return prev;
      const reset: Record<string, boolean> = {};
      for (const c of card.credits) reset[c.name] = c.realisticCaptureRate >= 0.5;
      const next = { ...prev, [cardKey]: reset };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  // Per-card captured-credit value from the current toggles.
  function captured(card: CardCatalogEntry): number {
    const u = usage[card.cardKey] ?? {};
    return card.credits.reduce((a, c) => a + (u[c.name] ? c.value : 0), 0);
  }

  const totals = useMemo(() => {
    let fees = 0;
    let creditsAvailable = 0;
    let creditsCaptured = 0;
    let spend12mo = 0;
    let points = 0;
    let pointsValueSum = 0;
    for (const { card, live } of cards) {
      fees += card.annualFee;
      creditsAvailable += maxCreditsValue(card);
      creditsCaptured += captured(card);
      if (live) {
        spend12mo += live.spend12mo;
        points += live.estPoints;
        pointsValueSum += live.estPointsValue;
      }
    }
    return {
      fees,
      creditsAvailable,
      creditsCaptured,
      netCost: fees - creditsCaptured,
      spend12mo,
      points,
      pointsValueSum,
    };
  }, [cards, usage]); // eslint-disable-line react-hooks/exhaustive-deps

  const anyLive = cards.some((c) => c.live);

  return (
    <div>
      {/* ── Portfolio summary ─────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Annual fees"
          value={formatMoney(totals.fees, currency, { cents: false })}
          accent="coral"
          sub={`${cards.length} cards`}
        />
        <Stat
          label="Credits you capture"
          value={formatMoney(totals.creditsCaptured, currency, { cents: false })}
          accent="blue"
          sub={`of ${formatMoney(totals.creditsAvailable, currency, { cents: false })} available`}
          delay={60}
        />
        <Stat
          label="Net annual cost"
          value={`${totals.netCost < 0 ? "+" : ""}${formatMoney(-totals.netCost, currency, { cents: false })}`}
          accent={totals.netCost <= 0 ? "blue" : "cream"}
          sub={totals.netCost <= 0 ? "credits cover the fees" : "fees minus credits used"}
          delay={120}
        />
        <Stat
          label="Est. points / yr"
          value={anyLive ? totals.points.toLocaleString() : "—"}
          accent="slate"
          sub={anyLive ? `≈ ${formatMoney(totals.pointsValueSum, currency, { cents: false })} value` : "no linked spend"}
          delay={180}
        />
      </div>

      <p className="mb-6 text-xs text-faint">
        Toggle the credits you actually use below — the net cost updates live and
        saves to this browser. Points are <em>estimated</em> by applying each
        card&rsquo;s earn rates to your categorized spend; credit/point cash
        values are research estimates, not exact figures.
        {!hydrated && " Loading your saved selections…"}
      </p>

      {/* ── Per-card detail ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        {cards.map(({ card, live }, i) => {
          const cap = captured(card);
          const maxCred = maxCreditsValue(card);
          const net = card.annualFee - cap;
          const u = usage[card.cardKey] ?? {};
          return (
            <section
              key={card.cardKey}
              className="card rise overflow-hidden p-0"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b hairline p-5 md:p-6">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 h-10 w-7 shrink-0 rounded-md ${accentBg[card.accent]} opacity-90`}
                    aria-hidden
                  />
                  <div>
                    <h2 className="font-display text-xl tracking-tight text-cream">
                      {card.displayName}
                    </h2>
                    <div className="mt-0.5 text-xs text-faint">
                      {card.issuer} · {card.network} · {card.pointProgram}
                    </div>
                    {live ? (
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.65rem] text-slate-soft">
                          linked{live.mask ? ` ···· ${live.mask}` : ""}
                        </span>
                        {live.balance != null && (
                          <span>
                            balance{" "}
                            <span className="tnum text-coral">
                              {formatMoney(live.balance, currency, { cents: false })}
                            </span>
                          </span>
                        )}
                        {live.limit != null && live.limit > 0 && (
                          <span>
                            limit{" "}
                            <span className="tnum">
                              {formatMoney(live.limit, currency, { cents: false })}
                            </span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="mt-1.5 text-xs text-faint">
                        Not matched to a connected account — showing reference
                        details only.
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="label-eyebrow">Annual fee</div>
                  <div className="tnum text-2xl text-cream">
                    {card.annualFee === 0
                      ? "$0"
                      : formatMoney(card.annualFee, currency, { cents: false })}
                  </div>
                  {card.legacyAnnualFee != null && (
                    <div className="text-[0.65rem] text-faint">
                      was {formatMoney(card.legacyAnnualFee, currency, { cents: false })}
                    </div>
                  )}
                </div>
              </div>

              {/* ROI strip */}
              <div className="grid grid-cols-2 gap-px bg-[var(--color-line)] md:grid-cols-4">
                <Mini label="Annual fee" value={formatMoney(card.annualFee, currency, { cents: false })} />
                <Mini
                  label="Credits you capture"
                  value={formatMoney(cap, currency, { cents: false })}
                  hint={`of ${formatMoney(maxCred, currency, { cents: false })}`}
                  accent="blue"
                />
                <Mini
                  label="Net cost"
                  value={`${net < 0 ? "+" : ""}${formatMoney(-net, currency, { cents: false })}`}
                  accent={net <= 0 ? "blue" : "cream"}
                />
                <Mini
                  label="Est. points / yr"
                  value={live ? live.estPoints.toLocaleString() : "—"}
                  hint={live ? `≈ ${formatMoney(live.estPointsValue, currency, { cents: false })}` : "no spend"}
                  accent="slate"
                />
              </div>

              <div className="p-5 md:p-6">
                {/* Verdict */}
                <div className="mb-5 rounded-xl border hairline bg-surface-2/40 px-4 py-3 text-sm">
                  {card.annualFee === 0 ? (
                    <span className="text-cream">
                      <span className={accentText[card.accent]}>No annual fee</span> —
                      pure upside.{" "}
                      {live
                        ? `You've put ${formatMoney(live.spend12mo, currency, { cents: false })} through it in the last 12 months, earning an estimated ${live.estPoints.toLocaleString()} points (≈${formatMoney(live.estPointsValue, currency)}).`
                        : "Keep it open — there's no cost to holding it."}
                    </span>
                  ) : net <= 0 ? (
                    <span className="text-cream">
                      The credits you use{" "}
                      <span className="text-blue">more than cover</span> the{" "}
                      {formatMoney(card.annualFee, currency, { cents: false })} fee
                      {net < 0
                        ? ` — you're ahead ${formatMoney(-net, currency, { cents: false })} before counting points.`
                        : "."}
                      {live &&
                        ` Points add ~${formatMoney(live.estPointsValue, currency, { cents: false })}/yr on top.`}
                    </span>
                  ) : (
                    <span className="text-cream">
                      After credits, this card costs{" "}
                      <span className="text-coral">
                        {formatMoney(net, currency, { cents: false })}
                      </span>
                      /yr.{" "}
                      {live && live.estPointsValue >= net
                        ? `Your ~${formatMoney(live.estPointsValue, currency, { cents: false })}/yr in estimated points covers the gap.`
                        : "Use more of the credits below — or weigh the perks — to justify it."}
                    </span>
                  )}
                </div>

                {/* Highlights */}
                {card.highlights.length > 0 && (
                  <ul className="mb-5 space-y-1.5">
                    {card.highlights.map((h, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-cream-dim">
                        <span className={`${accentText[card.accent]} shrink-0`}>›</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Earn rates */}
                <Block label="Earn rates">
                  <div className="flex flex-wrap gap-2">
                    {card.earnRates.map((r, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg border hairline bg-surface px-2.5 py-1.5 text-xs"
                        title={r.note}
                      >
                        <span className={`tnum font-semibold ${accentText[card.accent]}`}>
                          {r.multiplier}×
                        </span>{" "}
                        <span className="text-muted">{r.category}</span>
                      </span>
                    ))}
                  </div>
                  {live && (
                    <p className="mt-2 text-xs text-faint">
                      Spend (12 mo): {formatMoney(live.spend12mo, currency, { cents: false })}
                      {" · "}YTD: {formatMoney(live.spendYtd, currency, { cents: false })}
                      {" · "}
                      {live.txnCount} purchases · est. {live.estPoints.toLocaleString()} pts at{" "}
                      {card.pointValueCents}¢ = {formatMoney(live.estPointsValue, currency)}
                    </p>
                  )}
                </Block>

                {/* Credits checklist */}
                {card.credits.length > 0 && (
                  <Block
                    label={`Statement credits — ${formatMoney(cap, currency, { cents: false })} of ${formatMoney(maxCred, currency, { cents: false })} captured`}
                    action={
                      <button
                        onClick={() => resetCard(card.cardKey)}
                        className="text-[0.7rem] text-faint underline-offset-2 hover:text-blue hover:underline"
                      >
                        reset to typical
                      </button>
                    }
                  >
                    <ul className="space-y-1">
                      {card.credits.map((c) => {
                        const used = !!u[c.name];
                        return (
                          <li key={c.name}>
                            <button
                              onClick={() => toggle(card.cardKey, c.name)}
                              className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                                used
                                  ? "border-blue/40 bg-blue/10"
                                  : "hairline bg-surface hover:border-line-2"
                              }`}
                            >
                              <span
                                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[0.7rem] ${
                                  used
                                    ? "border-blue bg-blue text-ink"
                                    : "border-line-2 text-transparent"
                                }`}
                                aria-hidden
                              >
                                ✓
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="text-sm text-cream">{c.name}</span>
                                  <span className="tnum text-xs text-blue">
                                    {formatMoney(c.value, currency, { cents: false })}
                                  </span>
                                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.6rem] text-faint">
                                    {freqLabel(c.frequency)}
                                  </span>
                                  {isForgettable(c.frequency) && (
                                    <span className="rounded bg-coral/15 px-1.5 py-0.5 text-[0.6rem] text-coral">
                                      ↻ easy to forget
                                    </span>
                                  )}
                                  {c.enrollmentRequired && (
                                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.6rem] text-slate">
                                      enroll
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs text-faint">{c.howToUse}</p>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </Block>
                )}

                {/* Perks */}
                {card.perks.length > 0 && (
                  <Block label="Perks & benefits">
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {card.perks.map((p, idx) => (
                        <li
                          key={idx}
                          className="rounded-lg border hairline bg-surface px-3 py-2"
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm text-cream">{p.name}</span>
                            {p.value > 0 && (
                              <span className="tnum shrink-0 text-xs text-slate">
                                ≈{formatMoney(p.value, currency, { cents: false })}
                              </span>
                            )}
                          </div>
                          {p.note && (
                            <p className="mt-0.5 text-xs text-faint">{p.note}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Block>
                )}

                {/* Protections + transfer partners side by side */}
                <div className="grid gap-5 md:grid-cols-2">
                  {card.protections.length > 0 && (
                    <Block label="Protections & insurance">
                      <ul className="space-y-1 text-xs text-cream-dim">
                        {card.protections.map((p, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-faint">•</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </Block>
                  )}
                  {card.transferPartners.length > 0 && (
                    <Block label="Transfer partners">
                      <div className="flex flex-wrap gap-1.5">
                        {card.transferPartners.map((t, idx) => (
                          <span
                            key={idx}
                            className="rounded border hairline bg-surface px-2 py-1 text-[0.7rem] text-muted"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-faint">
                        Point value: {card.pointValueNote}
                      </p>
                    </Block>
                  )}
                </div>

                {/* Fine print */}
                <details className="mt-5 text-xs text-faint">
                  <summary className="cursor-pointer text-muted hover:text-cream">
                    Fee notes, recent changes & sources
                  </summary>
                  <div className="mt-2 space-y-2">
                    {card.feeNote && (
                      <p>
                        <span className="text-slate">Fee: </span>
                        {card.feeNote}
                      </p>
                    )}
                    <p>
                      <span className="text-slate">Recent changes: </span>
                      {card.recentChanges}
                    </p>
                    <p className="flex flex-wrap gap-x-3 gap-y-1">
                      <span className="text-slate">Sources:</span>
                      {card.sources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue underline-offset-2 hover:underline"
                        >
                          {new URL(s).hostname.replace("www.", "")}
                        </a>
                      ))}
                    </p>
                  </div>
                </details>
              </div>
            </section>
          );
        })}
      </div>

      {/* Unmatched credit accounts */}
      {unmatched.length > 0 && (
        <section className="card rise mt-5 p-5 md:p-6">
          <h2 className="font-display text-lg tracking-tight text-cream">
            Other connected credit accounts
          </h2>
          <p className="mb-3 mt-1 text-xs text-muted">
            These credit accounts didn&rsquo;t match a card in the catalog above
            (the names from your bank feed don&rsquo;t contain a recognizable card
            product). Their fees/perks aren&rsquo;t tracked here.
          </p>
          <ul className="divide-y divide-[var(--color-line)]">
            {unmatched.map((a, idx) => (
              <li key={idx} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-cream">
                  {a.name}
                  {a.mask ? <span className="text-faint"> ···· {a.mask}</span> : null}
                </span>
                {a.balance != null && (
                  <span className="tnum text-coral">
                    {formatMoney(a.balance, currency, { cents: false })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// ── small presentational helpers ──────────────────────────────────────────────

function Stat({
  label,
  value,
  sub,
  accent,
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "blue" | "coral" | "slate" | "cream";
  delay?: number;
}) {
  const color =
    accent === "blue"
      ? "text-blue"
      : accent === "coral"
        ? "text-coral"
        : accent === "slate"
          ? "text-slate"
          : "text-cream";
  return (
    <div className="card card-hover rise p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="label-eyebrow">{label}</div>
      <div className={`tnum mt-2 text-2xl ${color}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

function Mini({
  label,
  value,
  hint,
  accent = "cream",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "blue" | "coral" | "slate" | "cream";
}) {
  const color =
    accent === "blue"
      ? "text-blue"
      : accent === "coral"
        ? "text-coral"
        : accent === "slate"
          ? "text-slate"
          : "text-cream";
  return (
    <div className="bg-[var(--color-ink-2)] px-4 py-3">
      <div className="text-[0.6rem] uppercase tracking-wider text-faint">{label}</div>
      <div className={`tnum mt-1 text-base ${color}`}>{value}</div>
      {hint && <div className="text-[0.65rem] text-faint">{hint}</div>}
    </div>
  );
}

function Block({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <div className="label-eyebrow">{label}</div>
        {action}
      </div>
      {children}
    </div>
  );
}
