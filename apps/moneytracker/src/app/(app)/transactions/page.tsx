import { loadScopedState } from "@/lib/scoped-state";
import { findPossibleDuplicates, isSyntheticBaseline } from "@/lib/analytics";
import { TransactionsView } from "@/components/TransactionsView";
import { EmptyState, SectionCard, PageHeading } from "@/components/ui";
import { formatMoney, formatDate } from "@/lib/format";

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
  const acctName = new Map(state.accounts.map((a) => [a.id, a.name]));

  const renderDupe = (d: (typeof dupes)[number], i: number) => (
    <li
      key={i}
      className="flex items-center gap-3 rounded-xl border hairline bg-surface px-3 py-2.5 text-sm"
    >
      <span className="rounded bg-coral/15 px-1.5 py-0.5 text-[0.6rem] font-semibold text-coral">
        {d.transactions.length}×
      </span>
      <div className="min-w-0">
        <div className="truncate text-cream">{d.merchant}</div>
        <div className="text-xs text-faint">
          {formatDate(d.date)}
          {acctName.get(d.accountId) ? ` · ${acctName.get(d.accountId)}` : ""}
        </div>
      </div>
      <span className="tnum ml-auto text-cream">
        {d.transactions.length} × {formatMoney(d.amount, currency)} ={" "}
        {formatMoney(d.amount * d.transactions.length, currency)}
      </span>
    </li>
  );

  return (
    <div>
      <PageHeading
        title="Activity"
        subtitle={`${ledger.length} transactions ${
          focus ? `in ${focus.name}` : "across your accounts"
        }.`}
      />

      {dupes.length > 0 && (
        <SectionCard
          title={`Possible duplicate charges · ${dupes.length}`}
          delay={0}
          className="mb-4"
        >
          <p className="mb-3 -mt-2 text-xs text-muted">
            The same merchant and amount charged more than once on the same day,
            excluding known recurring bills — likely a true double-charge. Search
            the merchant below to review, then hide any extra.
          </p>
          <ul className="space-y-2">
            {dupes.slice(0, 12).map((d, i) => renderDupe(d, i))}
          </ul>
          {dupes.length > 12 && (
            <details className="group mt-2">
              <summary className="cursor-pointer list-none text-xs text-faint transition-colors hover:text-cream">
                + {dupes.length - 12} more
                <span className="group-open:hidden"> — show all</span>
                <span className="hidden group-open:inline"> — show less</span>
              </summary>
              <ul className="mt-2 space-y-2">
                {dupes.slice(12).map((d, i) => renderDupe(d, i + 12))}
              </ul>
            </details>
          )}
        </SectionCard>
      )}

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
          transactions={ledger}
          accounts={state.accounts}
          currency={currency}
          initial={initial}
        />
      )}
    </div>
  );
}
