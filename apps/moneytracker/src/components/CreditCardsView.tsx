"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  CardCatalogEntry,
  CardCredit,
  CardRoi,
  CardVerdict,
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

const STORAGE_KEY = "mt.cardperks.v3";

// Sparse per-card manual overrides, keyed by credit name. A credit appears here
// ONLY when the user explicitly overrode auto-detection (true = "I used it",
// false = "I didn't"). Absent → the credit follows detection automatically.
type OverrideMap = Record<string, Record<string, boolean>>;

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

  // Detection result for one credit on a card, if any.
  function detected(cardKey: string, creditName: string): CreditUsage | undefined {
    const live = cards.find((c) => c.card.cardKey === cardKey)?.live;
    return live?.creditUsage.find((u) => u.creditName === creditName);
  }

  // The box state: an explicit override wins; otherwise follow detection.
  function isUsed(cardKey: string, creditName: string): boolean {
    const ov = overrides[cardKey]?.[creditName];
    if (ov !== undefined) return ov;
    return detected(cardKey, creditName)?.usedThisPeriod ?? false;
  }

  function isOverridden(cardKey: string, creditName: string): boolean {
    return overrides[cardKey]?.[creditName] !== undefined;
  }

  // Click → set an explicit override to the opposite of what's shown now.
  function toggle(cardKey: string, creditName: string) {
    setOverrides((prev) => {
      // Derive the currently-shown value from `prev` (not the outer `overrides`
      // closure) so rapid successive toggles can't read a stale value.
      const ov = prev[cardKey]?.[creditName];
      const shown =
        ov !== undefined
          ? ov
          : detected(cardKey, creditName)?.usedThisPeriod ?? false;
      const next: OverrideMap = {
        ...prev,
        [cardKey]: { ...prev[cardKey], [creditName]: !shown },
      };
      persist(next);
      return next;
    });
  }

  // Drop a single override → that credit reverts to auto-detection.
  function clearOverride(cardKey: string, creditName: string) {
    setOverrides((prev) => {
      const card = { ...(prev[cardKey] ?? {}) };
      delete card[creditName];
      const next = { ...prev, [cardKey]: card };
      persist(next);
      return next;
    });
  }

  // Per-card captured-credit value. Prefers detection's trailing-12-month
  // matched spend (capped at the credit value); an override forces all/nothing;
  // undetectable credits fall back to their realistic capture rate.
  function captured(card: CardCatalogEntry): number {
    return card.credits.reduce((a, c) => {
      const ov = overrides[card.cardKey]?.[c.name];
      if (ov !== undefined) return a + (ov ? c.value : 0);
      const u = detected(card.cardKey, c.name);
      if (u?.detectable) return a + u.captured;
      return a + (c.realisticCaptureRate >= 0.5 ? c.value : 0);
    }, 0);
  }

  // Each card scored against the worth-it model, then filtered + sorted. Depends
  // on `overrides` (captured credits move with the user's corrections), so this
  // lives client-side rather than in the server page.
  const rows = useMemo(() => {
    const scored = cards.map(({ card, live, renewal }) => {
      const cap = captured(card);
      const roi = computeCardRoi(card, {
        capturedCredits: cap,
        estPoints: live?.estPoints ?? 0,
        hasLiveSpend: !!live,
      });
      const unusedForgettable = card.credits.filter(
        (c) => isForgettable(c.frequency) && !isUsed(card.cardKey, c.name),
      );
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
      creditsCaptured += captured(card);
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
                    used={(name) => isUsed(card.cardKey, name)}
                    overridden={(name) => isOverridden(card.cardKey, name)}
                    onToggle={(name) => toggle(card.cardKey, name)}
                    onClearOverride={(name) => clearOverride(card.cardKey, name)}
                    detect={(name) => detected(card.cardKey, name)}
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
  used,
  overridden,
  onToggle,
  onClearOverride,
  detect,
}: {
  card: CardCatalogEntry;
  live: CardLive | null;
  renewal: RenewalInfo | null;
  roi: CardRoi;
  cap: number;
  currency: string;
  unusedForgettable: CardCredit[];
  used: (creditName: string) => boolean;
  overridden: (creditName: string) => boolean;
  onToggle: (creditName: string) => void;
  onClearOverride: (creditName: string) => void;
  detect: (creditName: string) => CreditUsage | undefined;
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
        <ul className="space-y-1">
          {card.credits.map((c) => {
            const on = used(c.name);
            const ov = overridden(c.name);
            const d = detect(c.name);
            return (
              <li key={c.name}>
                <div
                  className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                    on ? "border-blue/40 bg-blue/10" : "hairline bg-surface"
                  }`}
                >
                  <button
                    onClick={() => onToggle(c.name)}
                    aria-pressed={on}
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-[0.7rem] ${
                      on ? "border-blue bg-blue text-ink" : "border-line-2 text-transparent hover:border-blue/60"
                    }`}
                  >
                    ✓
                  </button>
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
                      {ov ? (
                        <button
                          onClick={() => onClearOverride(c.name)}
                          className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.6rem] text-faint hover:text-blue"
                          title="Revert to auto-detection"
                        >
                          manual · auto
                        </button>
                      ) : d?.detectable && d.usedThisPeriod ? (
                        <span className="rounded bg-blue/10 px-1.5 py-0.5 text-[0.6rem] text-blue">
                          detected{d.matchedMerchant ? ` · ${d.matchedMerchant}` : ""}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-faint">{c.howToUse}</p>
                  </div>
                </div>
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
