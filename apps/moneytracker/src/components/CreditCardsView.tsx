"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  CardCatalogEntry,
  CardCredit,
  CardRoi,
  CardVerdict,
  CreditSlot,
  CreditUsage,
  PointsLine,
  RenewalInfo,
  computeCardRoi,
  maxCreditsValue,
} from "@/lib/cards";
import { formatMoney } from "@/lib/format";

/** Hostname of a source URL for display, tolerant of a malformed entry. */
function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

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
  /** Conservative (cash-out) value of the estimated points, in dollars. */
  estPointsCashValue: number;
  /** Aspirational (transfer-partner) value of the estimated points. */
  estPointsTransferValue: number;
  /** Where the points come from — spend → points by earn rule. */
  pointsLines: PointsLine[];
  /** Auto-detected statement-credit usage, one entry per credit (catalog order). */
  creditUsage: CreditUsage[];
}

export interface CardViewData {
  card: CardCatalogEntry;
  live: CardLive | null;
  /** Auto-detected renewal date + countdown, or null when undetectable. */
  renewal: RenewalInfo | null;
}

interface UnmatchedAccount {
  name: string;
  mask: string | null;
  balance: number | null;
}

const STORAGE_KEY = "mt.cardperks.v4";

// card → credit → slotKey → explicit user override (true = used, false = not).
// Absent slot → follows detection. Old v3 (credit-level booleans) is not migrated.
type OverrideMap = Record<string, Record<string, Record<string, boolean>>>;

type SortKey = "worth" | "attention" | "fee" | "credits" | "points";
type FilterKey = "fee" | "linked" | "attention" | "unused";

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

// Verdict → label + pill colors. Drives the leaderboard badge and detail header.
const VERDICT: Record<CardVerdict, { label: string; pill: string; text: string }> = {
  free: { label: "Free — keep it", pill: "bg-blue/15", text: "text-blue" },
  pays: { label: "Pays for itself", pill: "bg-blue/15", text: "text-blue" },
  earns: { label: "Earns its keep", pill: "bg-slate/20", text: "text-slate" },
  reconsider: { label: "Reconsider", pill: "bg-coral/15", text: "text-coral" },
};

const SORTS: { key: SortKey; label: string }[] = [
  { key: "worth", label: "Worth it" },
  { key: "attention", label: "Needs attention" },
  { key: "fee", label: "Fee" },
  { key: "credits", label: "Unused credits" },
  { key: "points", label: "Points" },
];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "fee", label: "Fee cards" },
  { key: "linked", label: "Linked" },
  { key: "attention", label: "Needs attention" },
  { key: "unused", label: "Forgotten credits" },
];

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

/** Monthly/quarterly/semiannual credits are the ones people forget — flag them. */
function isForgettable(f: CardCredit["frequency"]): boolean {
  return f === "monthly" || f === "quarterly" || f === "semiannual";
}

/** Net value formatted with an explicit + / − sign (higher = better). */
function signedMoney(v: number, currency: string): string {
  const m = formatMoney(Math.abs(v), currency, { cents: false });
  return v >= 0 ? `+${m}` : `−${m}`;
}

const RENEW_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2027-04-12" → "Apr 12, 2027". */
function formatRenewalDate(iso: string): string {
  const y = iso.slice(0, 4);
  const m = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  return `${RENEW_MONTHS[m - 1]} ${d}, ${y}`;
}

/**
 * Renewal urgency → tone classes. ≤30 days is pressing (coral); ≤60 days is the
 * product-change window (amber); beyond that it's just informational. `window`
 * marks the ≤60-day span where the downgrade prompt should appear.
 */
function renewalTone(daysUntil: number): {
  text: string;
  chip: string;
  window: boolean;
} {
  if (daysUntil <= 30)
    return { text: "text-coral", chip: "bg-coral/15 text-coral", window: true };
  if (daysUntil <= 60)
    return {
      text: "text-amber-400",
      chip: "bg-amber-400/15 text-amber-400",
      window: true,
    };
  return { text: "text-muted", chip: "bg-surface-2 text-faint", window: false };
}

/** Short countdown for the leaderboard row, e.g. "Renews 47d" / "Renews today". */
function renewalShort(daysUntil: number): string {
  if (daysUntil <= 0) return "Renews today";
  return `Renews ${daysUntil}d`;
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
  // Manual overrides layered on top of auto-detection. Starts empty (everything
  // follows detection); the user only ever adds an entry by correcting a box.
  const [overrides, setOverrides] = useState<OverrideMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("worth");
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);

  // Load saved overrides after mount. The server + first client paint render
  // pure detection (no overrides); we then sync in any saved corrections from
  // localStorage — the sanctioned pattern for hydrating browser-only state
  // without a mismatch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOverrides(JSON.parse(raw) as OverrideMap);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  function persist(next: OverrideMap) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  // The full usage record for one credit on a card, if linked.
  function usageFor(cardKey: string, creditName: string): CreditUsage | undefined {
    const live = cards.find((c) => c.card.cardKey === cardKey)?.live;
    return live?.creditUsage.find((u) => u.creditName === creditName);
  }

  // A slot's shown state: explicit per-slot override wins; else detection.
  function slotUsed(cardKey: string, creditName: string, slot: CreditSlot): boolean {
    const ov = overrides[cardKey]?.[creditName]?.[slot.key];
    if (ov !== undefined) return ov;
    return slot.used;
  }

  function slotOverridden(cardKey: string, creditName: string, slotKey: string): boolean {
    return overrides[cardKey]?.[creditName]?.[slotKey] !== undefined;
  }

  // Toggle one slot to the opposite of what's shown now (derive from `prev`).
  function toggleSlot(cardKey: string, creditName: string, slot: CreditSlot) {
    setOverrides((prev) => {
      const cur = prev[cardKey]?.[creditName]?.[slot.key];
      const shown = cur !== undefined ? cur : slot.used;
      const next: OverrideMap = {
        ...prev,
        [cardKey]: {
          ...prev[cardKey],
          [creditName]: { ...prev[cardKey]?.[creditName], [slot.key]: !shown },
        },
      };
      persist(next);
      return next;
    });
  }

  // Revert one slot to auto-detection.
  function clearSlotOverride(cardKey: string, creditName: string, slotKey: string) {
    setOverrides((prev) => {
      const credit = { ...(prev[cardKey]?.[creditName] ?? {}) };
      delete credit[slotKey];
      const next: OverrideMap = {
        ...prev,
        [cardKey]: { ...prev[cardKey], [creditName]: credit },
      };
      persist(next);
      return next;
    });
  }

  // Captured-so-far this year (exact), override-aware. For credits with no live
  // slots (unlinked), fall back to the realistic-capture heuristic.
  function capturedForCard(card: CardCatalogEntry): number {
    return card.credits.reduce((sum, c) => {
      const u = usageFor(card.cardKey, c.name);
      if (!u) return sum + (c.realisticCaptureRate >= 0.5 ? c.value : 0);
      const started = u.slots.filter((s) => s.status !== "future");
      const got = started.reduce((a, s) => {
        const used = slotUsed(card.cardKey, c.name, s);
        // A manual tick captures the full slot value; detection already capped.
        if (slotOverridden(card.cardKey, c.name, s.key)) return a + (used ? s.value : 0);
        return a + s.captured;
      }, 0);
      return sum + got;
    }, 0);
  }

  // Full-year projection for the stable ROI verdict: captured-so-far plus a
  // realistic estimate of slots that haven't started yet.
  function projectedCapturedForCard(card: CardCatalogEntry): number {
    return card.credits.reduce((sum, c) => {
      const u = usageFor(card.cardKey, c.name);
      if (!u) return sum + c.value * c.realisticCaptureRate;
      const future = u.slots.filter((s) => s.status === "future");
      const remaining = future.reduce((a, s) => a + s.value * c.realisticCaptureRate, 0);
      return sum + remaining;
    }, capturedForCard(card));
  }

  // Each card scored against the worth-it model, then filtered + sorted. Depends
  // on `overrides` (captured credits move with the user's corrections), so this
  // lives client-side rather than in the server page.
  const rows = useMemo(() => {
    const scored = cards.map(({ card, live, renewal }) => {
      const cap = capturedForCard(card);
      const roi = computeCardRoi(card, {
        capturedCredits: projectedCapturedForCard(card),
        estPoints: live?.estPoints ?? 0,
        hasLiveSpend: !!live,
      });
      // Forgettable credits whose CURRENT slot is still open (open or flagged).
      const unusedForgettable = card.credits.filter((c) => {
        if (!isForgettable(c.frequency)) return false;
        const u = usageFor(card.cardKey, c.name);
        const cur = u?.currentSlot;
        if (!cur) return false;
        return !slotUsed(card.cardKey, c.name, cur);
      });
      return { card, live, renewal, roi, cap, unusedForgettable };
    });

    let out = scored;
    if (filters.has("fee")) out = out.filter((r) => r.card.annualFee > 0);
    if (filters.has("linked")) out = out.filter((r) => r.live);
    if (filters.has("attention"))
      out = out.filter((r) => r.card.annualFee > 0 && r.roi.netValue < 0);
    if (filters.has("unused"))
      out = out.filter((r) => r.unusedForgettable.length > 0);

    const sorters: Record<
      SortKey,
      (a: (typeof scored)[number], b: (typeof scored)[number]) => number
    > = {
      worth: (a, b) => b.roi.netValue - a.roi.netValue,
      attention: (a, b) => a.roi.netValue - b.roi.netValue,
      fee: (a, b) => b.card.annualFee - a.card.annualFee,
      credits: (a, b) => a.roi.capturePct - b.roi.capturePct,
      points: (a, b) =>
        (b.live?.estPointsCashValue ?? 0) - (a.live?.estPointsCashValue ?? 0),
    };
    return [...out].sort(sorters[sortKey]);
  }, [cards, overrides, sortKey, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => {
    let fees = 0;
    let creditsAvailable = 0;
    let creditsCaptured = 0;
    let pointsCash = 0;
    let pointsTransfer = 0;
    let points = 0;
    for (const { card, live } of cards) {
      fees += card.annualFee;
      creditsAvailable += maxCreditsValue(card);
      creditsCaptured += capturedForCard(card);
      if (live) {
        points += live.estPoints;
        pointsCash += live.estPointsCashValue;
        pointsTransfer += live.estPointsTransferValue;
      }
    }
    return {
      fees,
      creditsAvailable,
      creditsCaptured,
      points,
      pointsCash,
      pointsTransfer,
      netValue: creditsCaptured + pointsCash - fees,
    };
  }, [cards, overrides]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open current-period slots across linked cards, soonest deadline first.
  const actionItems = useMemo(() => {
    type Item = {
      cardKey: string;
      cardName: string;
      creditName: string;
      value: number;
      label: string;
      daysLeft: number | null;
      flagged: boolean;
    };
    const items: Item[] = [];
    for (const { card, live } of cards) {
      if (!live) continue;
      for (const c of card.credits) {
        const u = usageFor(card.cardKey, c.name);
        const cur = u?.currentSlot;
        if (!u || !cur) continue;
        if (slotUsed(card.cardKey, c.name, cur)) continue;
        items.push({
          cardKey: card.cardKey,
          cardName: card.displayName,
          creditName: c.name,
          value: cur.value,
          label: cur.label,
          daysLeft: cur.daysLeft,
          flagged: cur.confidence === "flagged",
        });
      }
    }
    return items.sort(
      (a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999) || b.value - a.value,
    );
  }, [cards, overrides]); // eslint-disable-line react-hooks/exhaustive-deps

  const anyLive = cards.some((c) => c.live);
  const maxBarScale = Math.max(
    1,
    ...rows.map((r) =>
      Math.max(r.card.annualFee, r.cap + (r.live?.estPointsCashValue ?? 0)),
    ),
  );

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
          label="Net value / yr"
          value={signedMoney(totals.netValue, currency)}
          accent={totals.netValue >= 0 ? "blue" : "coral"}
          sub="credits + points − fees"
          delay={120}
        />
        <Stat
          label="Points value / yr"
          value={anyLive ? formatMoney(totals.pointsCash, currency, { cents: false }) : "—"}
          accent="slate"
          sub={
            anyLive
              ? `up to ${formatMoney(totals.pointsTransfer, currency, { cents: false })} via transfers`
              : "no linked spend"
          }
          delay={180}
        />
      </div>

      <p className="mb-5 text-xs text-faint">
        Net value combines what&rsquo;s real or grounded in your spend:{" "}
        <span className="text-blue">captured credits</span> +{" "}
        <span className="text-slate">points (at cash value)</span> − the annual
        fee. Credits tick themselves from your transactions and move the number;
        points are <em>estimated</em> by applying each card&rsquo;s earn rates to
        your categorized spend, shown as a range — conservative cash-out first,
        transfer-partner upside second. Perks aren&rsquo;t in the number
        (they&rsquo;re upside, listed per card). Tap any card for the breakdown.
        {!hydrated && " Loading your overrides…"}
      </p>

      {actionItems.length > 0 && (
        <ActionBanner items={actionItems} currency={currency} onJump={setExpanded} />
      )}

      {/* ── Toolbar: sort + filter ─────────────────────────────────────── */}
      <div className="sticky top-0 z-10 -mx-1 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 bg-ink/80 px-1 py-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="label-eyebrow shrink-0">Sort</span>
          <div className="inline-flex max-w-full overflow-x-auto rounded-lg border hairline bg-surface p-0.5 text-xs">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSortKey(s.key)}
                className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 transition-colors ${
                  sortKey === s.key ? "bg-surface-2 text-cream" : "text-muted hover:text-cream"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => {
            const active = filters.has(f.key);
            return (
              <button
                key={f.key}
                aria-pressed={active}
                onClick={() =>
                  setFilters((prev) => {
                    const next = new Set(prev);
                    if (next.has(f.key)) next.delete(f.key);
                    else next.add(f.key);
                    return next;
                  })
                }
                className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? "border-blue/40 bg-blue/15 text-blue"
                    : "hairline bg-surface text-muted hover:text-cream"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Leaderboard + single-expand detail ─────────────────────────── */}
      {rows.length === 0 ? (
        <p className="card rise p-6 text-sm text-muted">
          No cards match the current filters.
        </p>
      ) : (
        <div className="card rise overflow-hidden p-0">
          {/* desktop column header */}
          <div className="hidden grid-cols-[1.6fr_0.7fr_1.3fr_0.9fr_1.1fr_auto] gap-3 border-b hairline px-5 py-2.5 text-[0.6rem] uppercase tracking-wider text-faint md:grid">
            <span>Card</span>
            <span className="text-right">Fee</span>
            <span>Credits captured</span>
            <span className="text-right">Net value</span>
            <span>Verdict</span>
            <span className="w-4" />
          </div>
          {rows.map(({ card, live, renewal, roi, cap, unusedForgettable }, i) => {
            const open = expanded === card.cardKey;
            return (
              <Fragment key={card.cardKey}>
                <LeaderboardRow
                  card={card}
                  live={live}
                  renewal={renewal}
                  roi={roi}
                  cap={cap}
                  currency={currency}
                  barScale={maxBarScale}
                  unusedCount={unusedForgettable.length}
                  open={open}
                  delay={i * 40}
                  onClick={() => setExpanded(open ? null : card.cardKey)}
                />
                {open && (
                  <CardDetail
                    card={card}
                    live={live}
                    renewal={renewal}
                    roi={roi}
                    cap={cap}
                    currency={currency}
                    unusedForgettable={unusedForgettable}
                    usage={(name) => usageFor(card.cardKey, name)}
                    slotUsed={(name, slot) => slotUsed(card.cardKey, name, slot)}
                    slotOverridden={(name, key) => slotOverridden(card.cardKey, name, key)}
                    onToggleSlot={(name, slot) => toggleSlot(card.cardKey, name, slot)}
                    onClearSlot={(name, key) => clearSlotOverride(card.cardKey, name, key)}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      )}

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

// ── leaderboard row ───────────────────────────────────────────────────────────

function LeaderboardRow({
  card,
  live,
  renewal,
  roi,
  cap,
  currency,
  barScale,
  unusedCount,
  open,
  delay,
  onClick,
}: {
  card: CardCatalogEntry;
  live: CardLive | null;
  renewal: RenewalInfo | null;
  roi: CardRoi;
  cap: number;
  currency: string;
  barScale: number;
  unusedCount: number;
  open: boolean;
  delay: number;
  onClick: () => void;
}) {
  const v = VERDICT[roi.verdict];
  const pointsCash = live?.estPointsCashValue ?? 0;
  // Renewal chip only for fee cards with a detected anniversary.
  const showRenewal =
    card.annualFee > 0 && renewal?.detected && renewal.daysUntil != null;
  return (
    <button
      onClick={onClick}
      aria-expanded={open}
      style={{ animationDelay: `${delay}ms` }}
      className={`block w-full border-b hairline px-5 py-3.5 text-left transition-colors last:border-b-0 ${
        open ? "bg-surface-2/60" : "hover:bg-surface-2/30"
      }`}
    >
      {/* desktop grid / mobile stacked */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 md:grid-cols-[1.6fr_0.7fr_1.3fr_0.9fr_1.1fr_auto]">
        {/* name */}
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`h-9 w-6 shrink-0 rounded-md ${accentBg[card.accent]} opacity-90`}
            aria-hidden
          />
          <div className="min-w-0">
            <div className="truncate font-display text-base tracking-tight text-cream">
              {card.displayName}
            </div>
            <div className="truncate text-[0.7rem] text-faint">
              {card.issuer} · {card.pointProgram}
              {!live && " · not linked"}
            </div>
          </div>
        </div>

        {/* fee (desktop) */}
        <div className="hidden text-right md:block">
          <div className="tnum text-sm text-cream">
            {card.annualFee === 0
              ? "$0"
              : formatMoney(card.annualFee, currency, { cents: false })}
          </div>
        </div>

        {/* captured bar (desktop) */}
        <div className="hidden md:block">
          <WorthItBar fee={card.annualFee} credits={cap} points={pointsCash} scale={barScale} />
          <div className="mt-1 text-[0.65rem] text-faint">
            {formatMoney(cap, currency, { cents: false })}
            {card.credits.length > 0 && (
              <> of {formatMoney(roi.maxCredits, currency, { cents: false })}</>
            )}
            {live && pointsCash > 0 && (
              <> · +{formatMoney(pointsCash, currency, { cents: false })} pts</>
            )}
          </div>
        </div>

        {/* net value (desktop) */}
        <div className="hidden text-right md:block">
          <div className={`tnum text-sm ${roi.netValue >= 0 ? "text-blue" : "text-coral"}`}>
            {signedMoney(roi.netValue, currency)}
          </div>
          {unusedCount > 0 && (
            <div className="text-[0.6rem] text-coral">{unusedCount} unused</div>
          )}
        </div>

        {/* verdict */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 md:justify-start">
          <span className={`rounded-full px-2 py-0.5 text-[0.65rem] ${v.pill} ${v.text}`}>
            {v.label}
          </span>
          {showRenewal && (
            <span
              className={`rounded-full px-2 py-0.5 text-[0.6rem] ${renewalTone(renewal!.daysUntil!).chip}`}
              title={`Annual fee renews ${formatRenewalDate(renewal!.nextRenewal!)}`}
            >
              {renewalShort(renewal!.daysUntil!)}
            </span>
          )}
          {showRenewal && renewal!.expiry && (
            <span
              className="rounded-full bg-surface-2 px-2 py-0.5 text-[0.6rem] text-faint"
              title={`Card term runs through ${formatRenewalDate(renewal!.nextRenewal!)}`}
            >
              Exp {renewal!.expiry}
            </span>
          )}
        </div>
        <span
          className={`hidden justify-self-end text-faint transition-transform md:block ${open ? "rotate-90" : ""}`}
          aria-hidden
        >
          ›
        </span>
      </div>

      {/* mobile second line */}
      <div className="mt-2 flex items-center gap-3 md:hidden">
        <div className="flex-1">
          <WorthItBar fee={card.annualFee} credits={cap} points={pointsCash} scale={barScale} />
        </div>
        <span className="tnum shrink-0 text-xs text-faint">
          {card.annualFee === 0 ? "$0 fee" : formatMoney(card.annualFee, currency, { cents: false })}
        </span>
        <span className={`tnum shrink-0 text-sm ${roi.netValue >= 0 ? "text-blue" : "text-coral"}`}>
          {signedMoney(roi.netValue, currency)}
        </span>
      </div>
    </button>
  );
}

/** Stacked worth-it bar: credits (blue) + points (slate) filled against a shared
 *  scale, with a coral tick at the annual fee. Fill past the tick = net positive. */
function WorthItBar({
  fee,
  credits,
  points,
  scale,
}: {
  fee: number;
  credits: number;
  points: number;
  scale: number;
}) {
  const pct = (v: number) => `${Math.min(100, (v / scale) * 100)}%`;
  return (
    <div
      className="relative h-2 w-full overflow-hidden rounded-full bg-surface-2"
      title="Value returned vs. annual fee"
    >
      <div className="absolute inset-y-0 left-0 flex">
        <div className="bg-blue" style={{ width: pct(credits) }} />
        <div className="bg-slate" style={{ width: pct(points) }} />
      </div>
      {fee > 0 && (
        <div
          className="absolute inset-y-0 w-0.5 bg-coral"
          style={{ left: pct(fee) }}
          title="break-even (annual fee)"
        />
      )}
    </div>
  );
}

// ── card detail (expanded) ────────────────────────────────────────────────────

type DetailTab = "credits" | "earn" | "perks" | "protections" | "partners";

function CardDetail({
  card,
  live,
  renewal,
  roi,
  cap,
  currency,
  unusedForgettable,
  usage,
  slotUsed,
  slotOverridden,
  onToggleSlot,
  onClearSlot,
}: {
  card: CardCatalogEntry;
  live: CardLive | null;
  renewal: RenewalInfo | null;
  roi: CardRoi;
  cap: number;
  currency: string;
  unusedForgettable: CardCredit[];
  usage: (creditName: string) => CreditUsage | undefined;
  slotUsed: (creditName: string, slot: CreditSlot) => boolean;
  slotOverridden: (creditName: string, slotKey: string) => boolean;
  onToggleSlot: (creditName: string, slot: CreditSlot) => void;
  onClearSlot: (creditName: string, slotKey: string) => void;
}) {
  const allTabs: { key: DetailTab; label: string; show: boolean }[] = [
    { key: "credits", label: `Credits (${card.credits.length})`, show: card.credits.length > 0 },
    { key: "earn", label: "Earn rates", show: true },
    { key: "perks", label: `Perks (${card.perks.length})`, show: card.perks.length > 0 },
    { key: "protections", label: "Protections", show: card.protections.length > 0 },
    { key: "partners", label: "Transfer partners", show: card.transferPartners.length > 0 },
  ];
  const tabs = allTabs.filter((t) => t.show);
  const [tab, setTab] = useState<DetailTab>(tabs[0]?.key ?? "earn");
  const v = VERDICT[roi.verdict];

  return (
    <div className="border-b hairline bg-ink/40 px-5 py-5 md:px-6">
      {/* verdict line */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border hairline bg-surface-2/40 px-4 py-3 text-sm">
        <span className={`rounded-full px-2 py-0.5 text-[0.7rem] ${v.pill} ${v.text}`}>{v.label}</span>
        <span className="text-cream-dim">
          {card.annualFee === 0 ? (
            <>
              No annual fee — pure upside.
              {live && roi.pointsCashValue > 0
                ? ` You've earned an estimated ${formatMoney(roi.pointsCashValue, currency)} in points (12 mo).`
                : " Nothing to justify — keep it open."}
            </>
          ) : roi.netValue >= 0 ? (
            <>
              Captured credits{live && roi.pointsCashValue > 0 ? " + points" : ""} cover the{" "}
              {formatMoney(card.annualFee, currency, { cents: false })} fee — you&rsquo;re ahead{" "}
              <span className="text-blue">{signedMoney(roi.netValue, currency)}</span> a year.
            </>
          ) : roi.verdict === "earns" ? (
            <>
              On cash value it&rsquo;s {signedMoney(roi.netValue, currency)}/yr, but transfer your
              points and it swings to{" "}
              <span className="text-slate">{signedMoney(roi.netValueAspirational, currency)}</span>.
              Worth it only if you actually transfer.
            </>
          ) : (
            <>
              After credits and points this card costs{" "}
              <span className="text-coral">{signedMoney(roi.netValue, currency)}</span>/yr — even at
              full transfer value it&rsquo;s {signedMoney(roi.netValueAspirational, currency)}. Use more
              credits below or reconsider it.
            </>
          )}
        </span>
      </div>

      {/* live snapshot */}
      {live ? (
        <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border hairline bg-[var(--color-line)] sm:grid-cols-4">
          <Mini
            label="Spend (12 mo)"
            value={formatMoney(live.spend12mo, currency, { cents: false })}
            hint={`${live.txnCount} purchases`}
          />
          <Mini
            label="Credits captured"
            value={formatMoney(cap, currency, { cents: false })}
            hint={card.credits.length ? `of ${formatMoney(roi.maxCredits, currency, { cents: false })}` : "no credits"}
            accent="blue"
          />
          <Mini
            label="Est. points / yr"
            value={live.estPoints.toLocaleString()}
            hint={
              card.cashValueCents === card.transferValueCents
                ? `≈ ${formatMoney(live.estPointsCashValue, currency, { cents: false })}`
                : `${formatMoney(live.estPointsCashValue, currency, { cents: false })}–${formatMoney(live.estPointsTransferValue, currency, { cents: false })}`
            }
            accent="slate"
          />
          <Mini
            label="Net value / yr"
            value={signedMoney(roi.netValue, currency)}
            hint={`balance ${live.balance != null ? formatMoney(live.balance, currency, { cents: false }) : "—"}`}
            accent={roi.netValue >= 0 ? "blue" : "coral"}
          />
        </div>
      ) : (
        <p className="mb-4 rounded-xl border hairline bg-surface px-4 py-3 text-xs text-faint">
          Not matched to a connected account — reference details only. Net value
          assumes typical credit capture and no points.
        </p>
      )}

      {/* renewal countdown + product-change window */}
      {card.annualFee > 0 && (
        <RenewalBlock
          card={card}
          renewal={renewal}
          roi={roi}
          currency={currency}
        />
      )}

      {/* forgotten-money callout */}
      {unusedForgettable.length > 0 && (
        <div className="mb-4 rounded-xl border border-coral/30 bg-coral/5 px-4 py-3">
          <div className="mb-1 text-xs text-coral">
            ↻ {unusedForgettable.length} easy-to-forget{" "}
            {unusedForgettable.length === 1 ? "credit" : "credits"} you haven&rsquo;t tapped this
            period — worth up to{" "}
            {formatMoney(
              unusedForgettable.reduce((a, c) => a + c.value, 0),
              currency,
              { cents: false },
            )}
            /yr
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unusedForgettable.map((c) => (
              <span key={c.name} className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.65rem] text-cream-dim">
                {c.name} · {formatMoney(c.value, currency, { cents: false })} {freqLabel(c.frequency)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* highlights */}
      {card.highlights.length > 0 && (
        <ul className="mb-4 space-y-1.5">
          {card.highlights.map((h, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-cream-dim">
              <span className={`${accentText[card.accent]} shrink-0`}>›</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}

      {/* tab strip */}
      <div className="mb-3 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs transition-colors ${
              tab === t.key ? "bg-surface-2 text-cream" : "text-muted hover:text-cream"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* tab body */}
      {tab === "credits" && card.credits.length > 0 && (
        <ul className="space-y-2">
          {card.credits.map((c) => {
            const u = usage(c.name);
            const cur = u?.currentSlot ?? null;
            const curUsed = u && cur ? slotUsed(c.name, cur) : false;
            return (
              <li key={c.name} className="rounded-lg border hairline bg-surface px-3 py-2.5">
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

                {u ? (
                  <>
                    <SlotGrid
                      slots={u.slots}
                      used={(s) => slotUsed(c.name, s)}
                      overridden={(s) => slotOverridden(c.name, s.key)}
                      onToggle={(s) => onToggleSlot(c.name, s)}
                      onClear={(s) => onClearSlot(c.name, s.key)}
                    />
                    <div className="mt-1.5 text-[0.7rem] text-faint">
                      <span className="text-cream-dim">
                        {formatMoney(capturedThisYear(u, c, slotUsed, slotOverridden), currency, { cents: false })}
                      </span>{" "}
                      captured of {formatMoney(u.availableToDate, currency, { cents: false })} so far
                      {cur && (
                        <>
                          {" · "}
                          {curUsed
                            ? cur.evidence ?? `${cur.label} used`
                            : c.enrollmentRequired && cur.confidence === "flagged"
                              ? cur.evidence ?? `${cur.label} — did the credit post?`
                              : `${cur.label} unused — ${formatMoney(cur.value, currency, { cents: false })} waiting${cur.daysLeft != null ? ` · ${cur.daysLeft}d left` : ""}`}
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-faint">{c.howToUse}</p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-faint">
                    Not linked — reference only. {c.howToUse}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {tab === "earn" && (
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {card.earnRates.map((r, idx) => (
              <span
                key={idx}
                className="rounded-lg border hairline bg-surface px-2.5 py-1.5 text-xs"
                title={r.note}
              >
                <span className={`tnum font-semibold ${accentText[card.accent]}`}>{r.multiplier}×</span>{" "}
                <span className="text-muted">{r.category}</span>
              </span>
            ))}
          </div>
          {live && live.pointsLines.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-lg border hairline">
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-surface-2/50 px-3 py-1.5 text-[0.6rem] uppercase tracking-wider text-faint">
                  <span>From your spend</span>
                  <span className="text-right">Spend</span>
                  <span className="text-right">Points</span>
                </div>
                {live.pointsLines.map((l, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_auto_auto] gap-3 border-t hairline px-3 py-1.5 text-xs">
                    <span className="text-cream-dim">
                      {l.label}{" "}
                      <span className="text-faint">
                        {l.multiplier}×{l.capped ? " (capped)" : ""}
                      </span>
                    </span>
                    <span className="tnum text-right text-muted">
                      {formatMoney(l.spend, currency, { cents: false })}
                    </span>
                    <span className="tnum text-right text-slate">
                      {Math.round(l.points).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-t hairline bg-surface-2/30 px-3 py-1.5 text-xs">
                  <span className="text-cream">
                    ≈ {formatMoney(live.estPointsCashValue, currency)}
                    {card.cashValueCents !== card.transferValueCents && (
                      <> → {formatMoney(live.estPointsTransferValue, currency)} via transfers</>
                    )}
                  </span>
                  <span />
                  <span className="tnum text-right text-slate">{live.estPoints.toLocaleString()}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-faint">
                Valued at {card.cashValueCents}¢ (cash)
                {card.cashValueCents !== card.transferValueCents && (
                  <> – {card.transferValueCents}¢ (transfer)</>
                )}{" "}
                per point. {card.pointValueNote}
              </p>
            </>
          ) : (
            <p className="text-xs text-faint">{card.pointValueNote}</p>
          )}
        </div>
      )}

      {tab === "perks" && card.perks.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {card.perks.map((p, idx) => (
            <li key={idx} className="rounded-lg border hairline bg-surface px-3 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-cream">{p.name}</span>
                {p.value > 0 && (
                  <span className="tnum shrink-0 text-xs text-slate">
                    ≈{formatMoney(p.value, currency, { cents: false })}
                  </span>
                )}
              </div>
              {p.note && <p className="mt-0.5 text-xs text-faint">{p.note}</p>}
            </li>
          ))}
        </ul>
      )}

      {tab === "protections" && card.protections.length > 0 && (
        <ul className="space-y-1 text-xs text-cream-dim">
          {card.protections.map((p, idx) => (
            <li key={idx} className="flex gap-2">
              <span className="text-faint">•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}

      {tab === "partners" && card.transferPartners.length > 0 && (
        <div>
          <div className="flex flex-wrap gap-1.5">
            {card.transferPartners.map((t, idx) => (
              <span key={idx} className="rounded border hairline bg-surface px-2 py-1 text-[0.7rem] text-muted">
                {t}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-faint">Point value: {card.pointValueNote}</p>
        </div>
      )}

      {/* fine print */}
      <details className="mt-4 text-xs text-faint">
        <summary className="cursor-pointer text-muted hover:text-cream">
          Fee notes, recent changes &amp; sources
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
              <a key={idx} href={s} target="_blank" rel="noreferrer" className="text-blue underline-offset-2 hover:underline">
                {hostLabel(s)}
              </a>
            ))}
          </p>
        </div>
      </details>
    </div>
  );
}

/**
 * Renewal countdown for a fee card, plus — inside the ≤60-day product-change
 * window — a prompt to downgrade to a no-fee card before the fee posts. Rendered
 * only for fee cards (the caller guards `annualFee > 0`).
 */
function RenewalBlock({
  card,
  renewal,
  roi,
  currency,
}: {
  card: CardCatalogEntry;
  renewal: RenewalInfo | null;
  roi: CardRoi;
  currency: string;
}) {
  if (!renewal?.detected || renewal.daysUntil == null || !renewal.nextRenewal) {
    return (
      <p className="mb-4 rounded-xl border hairline bg-surface px-4 py-2.5 text-xs text-faint">
        Renewal date not detected yet — once an annual-fee charge posts on the
        linked account, the countdown to your next renewal shows here.
      </p>
    );
  }

  const days = renewal.daysUntil;
  const tone = renewalTone(days);
  const fee = renewal.feeAmount ?? card.annualFee;
  const feeStr = formatMoney(fee, currency, { cents: false });
  const reconsider = roi.verdict === "reconsider";
  const boxTone = tone.window
    ? days <= 30
      ? "border-coral/30 bg-coral/5"
      : "border-amber-400/30 bg-amber-400/5"
    : "hairline bg-surface";

  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 ${boxTone}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className={`text-sm ${tone.text}`}>
          {days <= 0 ? "Renews today" : `Renews in ${days} ${days === 1 ? "day" : "days"}`}
          <span className="text-faint"> · {formatRenewalDate(renewal.nextRenewal)}</span>
        </span>
        <span className="text-[0.65rem] text-faint">{feeStr} annual fee</span>
      </div>
      {renewal.expiry && (
        <div className="mt-1.5 flex items-center gap-2 border-t hairline pt-1.5 text-xs">
          <span className="tnum rounded-md bg-surface-2 px-2 py-0.5 font-medium text-cream-dim">
            Expires {renewal.expiry}
          </span>
          <span className="text-[0.65rem] text-faint">
            card term, from the annual-fee anniversary
          </span>
        </div>
      )}
      {tone.window && (
        <p
          className={`mt-1.5 text-xs ${reconsider ? `${tone.text} font-medium` : "text-cream-dim"}`}
        >
          {card.downgradeTo ? (
            <>
              Window to act: product-change/downgrade to{" "}
              <span className="text-cream">{card.downgradeTo.displayName}</span> before
              then to avoid the {feeStr} fee
              {reconsider ? " — this card isn't paying for itself." : "."}
            </>
          ) : (
            <>
              Window to act: cancel or product-change before the {feeStr} fee posts
              {reconsider ? " — this card isn't paying for itself." : "."}
            </>
          )}
        </p>
      )}
    </div>
  );
}

// ── small presentational helpers ──────────────────────────────────────────────

/** Per-slot value captured this year, override-aware (mirrors capturedForCard). */
function capturedThisYear(
  u: CreditUsage,
  c: CardCredit,
  used: (name: string, slot: CreditSlot) => boolean,
  overridden: (name: string, key: string) => boolean,
): number {
  return u.slots
    .filter((s) => s.status !== "future")
    .reduce((a, s) => {
      if (overridden(c.name, s.key)) return a + (used(c.name, s) ? s.value : 0);
      return a + s.captured;
    }, 0);
}

const SLOT_TONE: Record<string, string> = {
  confirmed: "border-blue bg-blue text-ink",
  inferred: "border-blue/60 bg-blue/15 text-blue",
  flagged: "border-amber-400/50 bg-amber-400/10 text-amber-400",
  open: "border-line-2 text-faint",
  future: "border-transparent bg-surface-2 text-faint/50",
};

/**
 * A tappable strip of period slots for one credit. Each slot is a button that
 * toggles a manual override (tap again, then "auto" to revert). Confirmed = solid
 * check, inferred = hollow check, flagged = "?", open current = ring, past open =
 * coral (missed), future = dim.
 */
function SlotGrid({
  slots,
  used,
  overridden,
  onToggle,
  onClear,
}: {
  slots: CreditSlot[];
  used: (slot: CreditSlot) => boolean;
  overridden: (slot: CreditSlot) => boolean;
  onToggle: (slot: CreditSlot) => void;
  onClear: (slot: CreditSlot) => void;
}) {
  const many = slots.length > 6; // monthly → compact cells
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1">
      {slots.map((s) => {
        const on = used(s);
        const ov = overridden(s);
        const isPastOpen = !on && s.status === "past" && s.confidence !== "flagged";
        const tone = on
          ? ov
            ? "border-blue bg-blue/80 text-ink"
            : SLOT_TONE[s.confidence] ?? SLOT_TONE.open
          : isPastOpen
            ? "border-coral/40 text-coral"
            : SLOT_TONE[s.confidence] ?? SLOT_TONE.open;
        const mark = on ? (s.confidence === "inferred" && !ov ? "◔" : "✓") : s.confidence === "flagged" ? "?" : "○";
        const glyph = on ? (s.confidence === "inferred" && !ov ? "◔" : "✓") : s.confidence === "flagged" ? "?" : s.label[0];
        return (
          <button
            key={s.key}
            onClick={() => (ov ? onClear(s) : onToggle(s))}
            title={`${s.label}: ${s.evidence ?? (on ? "used" : s.status === "future" ? "upcoming" : "open")}${ov ? " (manual — tap to revert)" : ""}`}
            aria-pressed={on}
            className={`grid place-items-center rounded-md border text-[0.65rem] transition-colors ${
              s.status === "current" ? "ring-1 ring-blue/50" : ""
            } ${tone} ${many ? "h-6 w-6" : "h-7 min-w-[2.4rem] px-2"}`}
          >
            {many ? glyph : `${s.label} ${mark}`}
          </button>
        );
      })}
    </div>
  );
}

/** Top-of-page "use it or lose it" list of open current-period credits. */
function ActionBanner({
  items,
  currency,
  onJump,
}: {
  items: {
    cardKey: string;
    cardName: string;
    creditName: string;
    value: number;
    label: string;
    daysLeft: number | null;
    flagged: boolean;
  }[];
  currency: string;
  onJump: (cardKey: string) => void;
}) {
  const total = items.reduce((a, i) => a + i.value, 0);
  return (
    <div className="rise mb-5 rounded-2xl border border-coral/25 bg-coral/5 p-4 md:p-5">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-base tracking-tight text-cream">
          Use it or lose it
        </h2>
        <span className="text-xs text-faint">
          {items.length} open · up to{" "}
          <span className="text-coral">{formatMoney(total, currency, { cents: false })}</span>{" "}
          this period
        </span>
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {items.map((i, idx) => {
          const urgent = i.daysLeft != null && i.daysLeft <= 3;
          const soon = i.daysLeft != null && i.daysLeft <= 7;
          const tone = urgent ? "text-coral" : soon ? "text-amber-400" : "text-faint";
          return (
            <li key={`${i.cardKey}-${i.creditName}-${idx}`}>
              <button
                onClick={() => onJump(i.cardKey)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border hairline bg-surface px-3 py-2 text-left transition-colors hover:bg-surface-2/40"
              >
                <span className="min-w-0">
                  <span className="tnum text-sm text-blue">
                    {formatMoney(i.value, currency, { cents: false })}
                  </span>{" "}
                  <span className="text-sm text-cream">{i.creditName}</span>
                  <span className="block truncate text-[0.65rem] text-faint">
                    {i.cardName} · {i.label}
                  </span>
                </span>
                <span className={`shrink-0 text-[0.7rem] ${tone}`}>
                  {i.flagged
                    ? "did it post?"
                    : i.daysLeft == null
                      ? "open"
                      : i.daysLeft <= 0
                        ? "ends today!"
                        : `${i.daysLeft}d left${urgent ? " !" : ""}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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
