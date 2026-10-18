import { loadStateCached } from "@/lib/store";
import {
  CARD_CATALOG,
  matchAccountToCard,
  cardSpend,
  cardSpendTxns,
  estimatePointsDetailed,
  detectCreditUsage,
  detectRenewal,
  cardStatus,
} from "@/lib/cards";
import { Account } from "@/lib/types";
import { PageHeading } from "@/components/ui";
import { CreditCardsView, CardViewData } from "@/components/CreditCardsView";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  // Unscoped management view — every card, regardless of the account picker.
  const state = await loadStateCached();
  const currency = state.accounts[0]?.currency ?? "USD";
  const creditAccounts = state.accounts.filter((a) => a.type === "credit");

  // Match each connected credit account to at most one catalog card, and each
  // card to at most one account. Whatever's left over is surfaced separately.
  const matchByCard = new Map<string, Account>();
  const matchedAccountIds = new Set<string>();
  for (const a of creditAccounts) {
    const key = matchAccountToCard(a);
    if (key && (!matchByCard.has(key) || matchByCard.get(key)?.availability === "unavailable")) {
      matchByCard.set(key, a);
      matchedAccountIds.add(a.id);
    }
  }

  const cards: CardViewData[] = CARD_CATALOG.map((card) => {
    const acct = matchByCard.get(card.cardKey) ?? null;
    const status = cardStatus(state, card.cardKey, acct);
    if (!acct) return { card, status, reported: false, live: null, renewal: null };
    const spend = cardSpend(state, acct.id);
    const est = estimatePointsDetailed(card, cardSpendTxns(state, acct.id, true), spend.periodStart);
    return {
      card,
      status,
      reported: acct.availability !== "unavailable",
      historyAccountId: acct.id,
      renewal: detectRenewal(state, acct.id, card),
      live: {
        accountId: acct.id,
        periodStart: spend.periodStart,
        accountName: acct.name,
        mask: acct.mask,
        balance: acct.balances.current,
        limit: acct.balances.limit,
        spend12mo: spend.total12mo,
        spendYtd: spend.totalYtd,
        txnCount: spend.count,
        estPoints: est.points,
        estPointsCashValue: est.cashValue,
        estPointsTransferValue: est.transferValue,
        pointsLines: est.lines,
        creditUsage: detectCreditUsage(state, acct.id, card),
      },
    };
  });

  const unmatched = creditAccounts
    .filter((a) => !matchedAccountIds.has(a.id) && a.availability !== "unavailable")
    .map((a) => ({
      name: a.name,
      mask: a.mask,
      balance: a.balances.current,
    }));

  return (
    <div>
      <PageHeading
        title="Credit Cards"
        subtitle="Every card's annual fee, perks, and credits — and what you actually get back in credits, points, and benefits."
      />
      <CreditCardsView cards={cards} unmatched={unmatched} currency={currency} />
    </div>
  );
}
