import { loadStateCached } from "@/lib/store";
import {
  CARD_CATALOG,
  matchAccountToCard,
  cardSpend,
  estimatePoints,
  pointsValue,
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
    if (key && !matchByCard.has(key)) {
      matchByCard.set(key, a);
      matchedAccountIds.add(a.id);
    }
  }

  const cards: CardViewData[] = CARD_CATALOG.map((card) => {
    const acct = matchByCard.get(card.cardKey) ?? null;
    if (!acct) return { card, live: null };
    const spend = cardSpend(state, acct.id);
    const pts = estimatePoints(card, spend.byCategory);
    return {
      card,
      live: {
        accountName: acct.name,
        mask: acct.mask,
        balance: acct.balances.current,
        limit: acct.balances.limit,
        spend12mo: spend.total12mo,
        spendYtd: spend.totalYtd,
        txnCount: spend.count,
        estPoints: pts,
        estPointsValue: pointsValue(card, pts),
      },
    };
  });

  const unmatched = creditAccounts
    .filter((a) => !matchedAccountIds.has(a.id))
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
