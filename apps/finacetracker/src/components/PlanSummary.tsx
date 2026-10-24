import Link from "@/components/AppLink";
import type { AppState } from "@/lib/types";
import { filterStateByCurrency } from "@/lib/currency";
import { spendingByCategory, todayKey } from "@/lib/analytics";
import { goalProgress, nextBillDate } from "@/lib/planning";
import { formatDate, formatMoney } from "@/lib/format";

export function PlanSummary({ state, currency }: { state: AppState; currency: string }) {
  const scoped = filterStateByCurrency(state, currency);
  const today = todayKey();
  const goals = scoped.goals ?? [];
  const budgets = scoped.budgets ?? [];
  const spending = spendingByCategory(scoped, today.slice(0, 7));
  const over = budgets.filter((b) => (spending.find((s) => s.category === b.category)?.total ?? 0) > b.limit).length;
  const nextGoal = goals.filter((g) => g.saved < g.target).sort((a, b) => (a.targetDate ?? "9999").localeCompare(b.targetDate ?? "9999"))[0];
  const bills = (scoped.billReminders ?? []).filter((b) => b.status === "active").sort((a, b) => nextBillDate(a, today).localeCompare(nextBillDate(b, today)));
  return <section aria-label="Your financial plan" className="my-5 grid gap-3 sm:grid-cols-3">
    <Link href="/goals" className="card min-w-0 p-4 transition-colors hover:border-blue"><p className="label-eyebrow">Savings goals →</p><p className="mt-2 break-words font-medium text-cream">{nextGoal ? nextGoal.name : goals.length ? "Goals complete" : "Set your first goal"}</p><p className="mt-1 text-xs text-muted">{nextGoal ? `${Math.round(goalProgress(nextGoal, today).percent)}% saved · ${formatMoney(goalProgress(nextGoal, today).remaining, currency)} to go` : "Plan your next milestone"}</p></Link>
    <Link href="/budgets" className="card min-w-0 p-4 transition-colors hover:border-blue"><p className="label-eyebrow">Monthly budgets →</p><p className={`mt-2 font-medium ${over ? "text-coral" : "text-cream"}`}>{over ? `${over} ${over === 1 ? "category" : "categories"} over budget` : budgets.length ? "Within recorded limits" : "Build your budget"}</p><p className="mt-1 text-xs text-muted">{budgets.length ? `${budgets.length} categories · current calendar month` : "Give each spending category a limit"}</p></Link>
    <Link href="/recurring" className="card min-w-0 p-4 transition-colors hover:border-blue"><p className="label-eyebrow">Bills & subscriptions →</p><p className="mt-2 break-words font-medium text-cream">{bills[0] ? bills[0].name : "Review recurring costs"}</p><p className="mt-1 text-xs text-muted">{bills[0] ? `${formatMoney(bills[0].amount, currency)} · next ${formatDate(nextBillDate(bills[0], today))}` : "See upcoming bills and add reminders"}</p></Link>
  </section>;
}
