import { redirect } from "next/navigation";
import { loadScopedState } from "@/lib/scoped-state";
import { availableMonths, categoryDetail } from "@/lib/analytics";
import { CategoryDetail } from "@/components/CategoryDetail";
import { EmptyState, PageHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CategoryDetailPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; month?: string }>;
}) {
  const { state } = await loadScopedState();
  const sp = await searchParams;

  if (!sp.category) redirect("/spending");

  const months = availableMonths(state);
  if (months.length === 0) {
    return (
      <div>
        <PageHeading title="Spending" subtitle="Where the money goes." />
        <EmptyState />
      </div>
    );
  }

  const month =
    sp.month && months.includes(sp.month) ? sp.month : months[months.length - 1];
  const currency = state.accounts[0]?.currency ?? "USD";
  const accountNames = Object.fromEntries(
    state.accounts.map((a) => [a.id, a.name]),
  );

  const data = categoryDetail(state, sp.category!, month);

  return (
    <CategoryDetail
      data={data}
      currency={currency}
      months={months}
      accountNames={accountNames}
    />
  );
}
