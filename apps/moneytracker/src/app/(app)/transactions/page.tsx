import { loadScopedState } from "@/lib/scoped-state";
import { findPossibleDuplicates, isSyntheticBaseline } from "@/lib/analytics";
import { TransactionsView } from "@/components/TransactionsView";
import { EmptyState, SectionCard, PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    q?: string;
    merchant?: string;
    account?: string;
    month?: string;
  }>;
}) {
  const { state, focus } = await loadScopedState();
  const currency = state.accounts[0]?.currency ?? "USD";
  const sp = await searchParams;

  // The Activity feed is the raw ledger: hide the synthetic "(estimated)"
  // baseline rows that only exist to keep analytics totals honest — they have
  // no real account and can't be edited.
  const ledger = state.transactions.filter((t) => !isSyntheticBaseline(t));

  // A ?merchant= link pre-fills the search box; ?account= picks the dropdown
  // (validated against accounts actually present); ?month=yyyy-mm scopes to one
  // month (set by the spending-donut drill-through).
  const initial = {
    q: sp.q || sp.merchant || "",
    category: sp.category || "ALL",
    account:
      sp.account && state.accounts.some((a) => a.id === sp.account)
        ? sp.account
        : "ALL",
    month: /^\d{4}-\d{2}$/.test(sp.month ?? "") ? sp.month! : "ALL",
  };

  const dupes = findPossibleDuplicates(state);

  return (
    <div>
      <PageHeading
        title="Activity"
        subtitle={`${ledger.length} transactions ${
          focus ? `in ${focus.name}` : "across your accounts"
        }.`}
      />

      {ledger.length === 0 ? (
        state.accounts.length === 0 ? (
          <EmptyState />
        ) : (
          <SectionCard>
            <p className="py-10 text-center text-sm text-muted">
              No transactions synced yet. Try “Sync now”.
            </p>
          </SectionCard>
        )
      ) : (
        <TransactionsView
          key={JSON.stringify([focus?.id, initial])}
          transactions={ledger}
          duplicateGroups={dupes}
          accounts={state.accounts}
          currency={currency}
          initial={initial}
        />
      )}
    </div>
  );
}
