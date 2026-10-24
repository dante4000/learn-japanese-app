import { GoalsTracker } from "@/components/GoalsTracker";
import { PageHeading } from "@/components/ui";
import { loadScopedState } from "@/lib/scoped-state";
import { todayKey } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const { state } = await loadScopedState();
  const currency = state.currency ?? "USD";
  return <div><PageHeading title="Goals" subtitle={`Turn what matters into a savings plan. Goals cover all accounts in ${currency}.`} /><GoalsTracker key={currency} goals={state.goals ?? []} currency={currency} today={todayKey()} /></div>;
}
