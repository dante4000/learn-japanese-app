import { loadState } from "@/lib/store";
import { computeNetWorth, groupAccounts } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { Account } from "@/lib/types";
import { SectionCard, EmptyState, PageHeading } from "@/components/ui";
import { ManualEntries } from "@/components/ManualEntries";

export const dynamic = "force-dynamic";

function AccountRow({ a, currency }: { a: Account; currency: string }) {
  const bal = a.balances.current ?? 0;
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border hairline bg-surface-2 text-xs uppercase text-slate-soft">
        {a.subtype?.slice(0, 2) ?? a.type.slice(0, 2)}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm text-cream">{a.name}</div>
        <div className="text-xs text-faint">
          {a.subtype || a.type}
          {a.mask ? ` ···· ${a.mask}` : ""}
        </div>
      </div>
      <span className="tnum ml-auto text-sm text-cream">
        {formatMoney(bal, currency, { cents: false })}
      </span>
    </li>
  );
}

export default async function AccountsPage() {
  const state = await loadState();
  const nw = computeNetWorth(state);
  const { assets, liabilities } = groupAccounts(state);
  const cur = nw.currency;

  if (state.accounts.length === 0 && state.manualEntries.length === 0) {
    return (
      <div>
        <PageHeading title="Accounts" subtitle="Balances across everything you own and owe." />
        <EmptyState />
      </div>
    );
  }

  return (
    <div>
      <PageHeading title="Accounts" subtitle="Balances across everything you own and owe." />

      <div className="mb-5 grid grid-cols-3 gap-4">
        <div className="card rise p-5">
          <div className="label-eyebrow">Assets</div>
          <div className="tnum mt-2 text-xl text-blue">
            {formatMoney(nw.totalAssets, cur, { cents: false })}
          </div>
        </div>
        <div className="card rise p-5" style={{ animationDelay: "60ms" }}>
          <div className="label-eyebrow">Liabilities</div>
          <div className="tnum mt-2 text-xl text-coral">
            {formatMoney(nw.totalLiabilities, cur, { cents: false })}
          </div>
        </div>
        <div className="card rise p-5" style={{ animationDelay: "120ms" }}>
          <div className="label-eyebrow">Net worth</div>
          <div className="tnum mt-2 text-xl text-cream">
            {formatMoney(nw.netWorth, cur, { cents: false })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Assets" delay={160}>
          {assets.length ? (
            <ul className="divide-y divide-[var(--color-line)]">
              {assets.map((a) => (
                <AccountRow key={a.id} a={a} currency={cur} />
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted">No asset accounts.</p>
          )}
        </SectionCard>

        <SectionCard title="Liabilities" delay={200}>
          {liabilities.length ? (
            <ul className="divide-y divide-[var(--color-line)]">
              {liabilities.map((a) => (
                <AccountRow key={a.id} a={a} currency={cur} />
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted">No liabilities. Nice.</p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Manual assets & liabilities"
        delay={240}
        className="mt-4"
      >
        <p className="mb-4 -mt-2 text-xs text-muted">
          Add things no bank reports — home value, car, cash — so net worth is
          complete.
        </p>
        <ManualEntries entries={state.manualEntries} currency={cur} />
      </SectionCard>
    </div>
  );
}
