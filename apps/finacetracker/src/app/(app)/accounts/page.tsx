import { availableCurrencies, filterStateByCurrency } from "@/lib/currency";
import { BalanceCoverage } from "@/components/BalanceCoverage";
import { DetailLink } from "@/components/DetailPanel";
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
  canFocus,
}: {
  a: Account;
  canFocus: boolean;
}) {
  const bal = a.balances.current ?? 0;
  const isLiability = LIABILITY_TYPES.has(a.type);
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border hairline bg-surface-2 text-xs uppercase text-slate-soft">
        {a.subtype?.slice(0, 2) ?? a.type.slice(0, 2)}
      </span>
      <div className="min-w-0 flex-1 basis-[calc(100%-4rem)] sm:basis-auto">
        <div className="truncate text-sm text-cream"><DetailLink query={{ metric: "account", account: a.id }}>{a.name}</DetailLink></div>
        <div className="text-xs text-faint">
          {a.subtype || a.type}
          {a.mask ? ` ···· ${a.mask}` : ""}
          {a.availability === "unavailable" ? " · Not reported by Plaid · history retained" : ""}
        </div>
      </div>
      <span
        className={`tnum ml-auto shrink-0 text-sm ${isLiability ? "text-coral" : "text-cream"}`}
      >
        {/* For a liability the headline is what you owe (−balance): a positive
            balance shows as −$X (debt), a negative balance as +$X (a credit in
            your favor) rather than misreading as more debt. */}
        {a.availability === "unavailable" || a.balances.current == null ? "Balance unavailable" : isLiability
          ? formatMoney(-bal, a.currency, { sign: true })
          : formatMoney(bal, a.currency)}
      </span>
      {canFocus && <ViewAccountButton id={a.id} />}
    </li>
  );
}

interface InstitutionGroup {
  name: string;
  accounts: Account[];
  currency: string;
  complete: boolean;
  net: number; // assets − liabilities within this institution
}

/** Accounts grouped per connection (Bilt, Amex, Chase, …), in item order. */
function groupByInstitution(
  items: { id: string; institutionName: string }[],
  accounts: Account[],
): InstitutionGroup[] {
  const groups = new Map<string, InstitutionGroup>();
  for (const account of accounts) {
    const name = items.find((i) => i.id === account.itemId)?.institutionName ?? "Other";
    const key = `${name}:${account.currency}`;
    const group = groups.get(key) ?? { name, currency: account.currency, complete: true, accounts: [], net: 0 };
    group.accounts.push(account);
    if (account.balances.current == null || account.availability === "unavailable") group.complete = false;
    else group.net += LIABILITY_TYPES.has(account.type) ? -account.balances.current : account.balances.current;
    groups.set(key, group);
  }
  return [...groups.values()];
}

export default async function AccountsPage() {
  // Intentionally unscoped: this is the management view of every account.
  const state = await loadStateCached();
  const currencies = availableCurrencies(state).length ? availableCurrencies(state) : ["USD"];
  const canFocus = state.accounts.length > 1;
  const institutions = groupByInstitution(state.items, state.accounts);


  return (
    <div>
      <PageHeading title="Accounts" subtitle="Balances across everything you own and owe." />

      {state.accounts.length === 0 && <EmptyState />}
      {currencies.map((currency) => {
        const scoped = filterStateByCurrency(state, currency);
        const nw = computeNetWorth(scoped);
        return <section key={currency} className="my-5"><h2 className="text-sm font-semibold text-cream">{currency} balances{!nw.complete ? " · partial" : ""}</h2><BalanceCoverage state={scoped} /><div className="mt-3 grid gap-4 sm:grid-cols-3">{[["Assets", nw.totalAssets], ["Liabilities", nw.totalLiabilities], ["Net worth", nw.netWorth]].map(([label, value]) => <div key={label} className="card p-5"><p className="label-eyebrow">{label}{!nw.complete ? " · known balances" : ""}</p><p className="tnum mt-2 text-xl text-cream"><DetailLink query={{ metric: "networth", account: "all", currency }}>{formatMoney(value as number, currency)}</DetailLink></p></div>)}</div></section>;
      })}

      <div className="grid gap-4 lg:grid-cols-2">
        {institutions.map((g, i) => (
          <SectionCard
            key={`${g.name}:${g.currency}`}
            title={`${g.name} · ${g.currency}`}
            delay={160 + i * 40}
            action={
              <span
                className={`tnum text-sm ${g.net < 0 ? "text-coral" : "text-muted"}`}
              >
                {!g.complete ? "Partial: " : ""}{formatMoney(g.net, g.currency)}
              </span>
            }
          >
            <ul className="divide-y divide-[var(--color-line)]">
              {g.accounts.map((a) => (
                <AccountRow key={a.id} a={a} canFocus={canFocus} />
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
        {[...new Set(["USD", ...currencies])].map((currency) => <section key={currency} className="mt-4"><h3 className="mb-3 text-sm text-muted">{currency}</h3><ManualEntries entries={state.manualEntries.filter((m) => (m.currency ?? "USD") === currency)} currency={currency} /></section>)}
      </SectionCard>
    </div>
  );
}
