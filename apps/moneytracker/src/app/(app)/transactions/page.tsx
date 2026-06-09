import { loadState } from "@/lib/store";
import { TransactionsView } from "@/components/TransactionsView";
import { EmptyState, SectionCard, PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const state = await loadState();
  const currency = state.accounts[0]?.currency ?? "USD";

  return (
    <div>
      <PageHeading
        title="Activity"
        subtitle={`${state.transactions.length} transactions across your accounts.`}
      />
      {state.transactions.length === 0 ? (
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
          transactions={state.transactions}
          accounts={state.accounts}
          currency={currency}
        />
      )}
    </div>
  );
}
