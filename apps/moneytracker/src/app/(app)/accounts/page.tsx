import { loadStateCached } from "@/lib/store";
import { computeNetWorth, LIABILITY_TYPES } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { Account } from "@/lib/types";
import { SectionCard, EmptyState, PageHeading } from "@/components/ui";
import { ManualEntries } from "@/components/ManualEntries";
import { ViewAccountButton } from "@/components/AccountPicker";

export const dynamic = "force-dynamic";

function AccountRow({
  a,
  currency,
  canFocus,
}: {
  a: Account;
  currency: string;
  canFocus: boolean;
}) {
  const bal = a.balances.current ?? 0;
  const isLiability = LIABILITY_TYPES.has(a.type);
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
      <span
        className={`tnum ml-auto text-sm ${isLiability ? "text-coral" : "text-cream"}`}
      >
        {isLiability && bal > 0 ? "−" : ""}
        {formatMoney(bal, currency, { cents: false })}
      </span>
      {canFocus && <ViewAccountButton id={a.id} />}
    </li>
  );
}

interface InstitutionGroup {
  name: string;
  accounts: Account[];
  net: number; // assets − liabilities within this institution
}

/** Accounts grouped per connection (Bilt, Amex, Chase, …), in item order. */
function groupByInstitution(
  items: { id: string; institutionName: string }[],
  accounts: Account[],
): InstitutionGroup[] {
  const byItem = new Map<string, InstitutionGroup>();
  const groups: InstitutionGroup[] = [];
  for (const it of items) {
    // Two items from the same bank (e.g. Chase re-linked) share one group.
    const existing = groups.find((g) => g.name === it.institutionName);
    const group = existing ?? { name: it.institutionName, accounts: [], net: 0 };
    if (!existing) groups.push(group);
    byItem.set(it.id, group);
  }
  const orphans: InstitutionGroup = { name: "Other", accounts: [], net: 0 };
  for (const a of accounts) {
    const group = byItem.get(a.itemId) ?? orphans;
    group.accounts.push(a);
    const bal = a.balances.current ?? 0;
    group.net += LIABILITY_TYPES.has(a.type) ? -bal : bal;
  }
  if (orphans.accounts.length) groups.push(orphans);
  return groups.filter((g) => g.accounts.length > 0);
}

export default async function AccountsPage() {
  // Intentionally unscoped: this is the management view of every account.
  const state = await loadStateCached();
  const nw = computeNetWorth(state);
  const cur = nw.currency;
  const canFocus = state.accounts.length > 1;
  const institutions = groupByInstitution(state.items, state.accounts);

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
        {institutions.map((g, i) => (
          <SectionCard
            key={g.name}
            title={g.name}
            delay={160 + i * 40}
            action={
              <span
                className={`tnum text-sm ${g.net < 0 ? "text-coral" : "text-muted"}`}
              >
                {formatMoney(g.net, cur, { cents: false })}
              </span>
            }
          >
            <ul className="divide-y divide-[var(--color-line)]">
              {g.accounts.map((a) => (
                <AccountRow key={a.id} a={a} currency={cur} canFocus={canFocus} />
              ))}
            </ul>
          </SectionCard>
        ))}
      </div>

      <SectionCard
        title="Manual assets & liabilities"
        delay={160 + institutions.length * 40}
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
