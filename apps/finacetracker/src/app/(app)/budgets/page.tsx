import { BudgetsTracker } from "@/components/BudgetsTracker";
import { MonthPicker } from "@/components/MonthPicker";
import { PageHeading } from "@/components/ui";
import { loadScopedState } from "@/lib/scoped-state";
import { filterStateByCurrency } from "@/lib/currency";
import { spendingByCategory, todayKey } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { state, fullState } = await loadScopedState();
  const currency = state.currency ?? "USD";
  const all = filterStateByCurrency(fullState, currency);
  const query = await searchParams;
  const current = todayKey().slice(0, 7);
  const month = query.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month) ? query.month : current;
  const months = [...new Set([current, month, ...all.transactions.map((t) => t.date.slice(0, 7))])].sort();
  return <div>
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><PageHeading title="Budgets" subtitle={`Monthly limits across all ${currency} accounts. Track spending before it adds up.`} /><MonthPicker selected={month} months={months} /></div>
    <BudgetsTracker key={currency} budgets={all.budgets ?? []} spending={spendingByCategory(all, month)} currency={currency} month={month} />
  </div>;
}
