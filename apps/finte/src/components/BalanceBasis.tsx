import type { AppState } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/format";
import { DetailLink } from "./DetailPanel";

/** Available cash is a separate bank measure, never an extra asset. */
export function BalanceBasis({ state }: { state: AppState }) {
  const cash = state.accounts.filter((a) => a.type === "depository");
  const known = cash.filter((a) => a.availability !== "unavailable");
  const current = known.reduce((sum, a) => sum + (a.balances.current ?? 0), 0);
  const available = known.reduce((sum, a) => sum + (a.balances.available ?? 0), 0);
  const currentComplete = known.length === cash.length && known.every((a) => a.balances.current !== null);
  const availableComplete = known.length === cash.length && known.every((a) => a.balances.available !== null);
  const currency = state.currency ?? "USD";
  const items = state.items.filter((i) => state.accounts.some((a) => a.itemId === i.id));
  return <div className="mt-4 space-y-2 text-xs leading-relaxed text-muted">
    <p>Net worth uses reported current balances: assets minus liabilities. Available cash can differ because of holds and pending activity.</p>
    {cash.length > 0 && <p className="tnum">{currentComplete ? "Current cash" : "Known current cash"}: {formatMoney(current, currency)} · {availableComplete ? "Available cash" : "Known available cash"}: {formatMoney(available, currency)}{currentComplete && availableComplete ? ` · Difference: ${formatMoney(current - available, currency)}` : ". Cash totals are partial."}</p>}
    <details><summary className="cursor-pointer py-2">Balance sources and sync status</summary><ul className="space-y-2">{items.map((i) => <li key={i.id}><DetailLink query={{ metric: "connection", record: i.id }}>{i.institutionName}</DetailLink>: {i.provider !== "plaid" ? "Imported or manual balances" : i.balanceSource === "live" ? "Live balance request" : "Cached bank balances; bank update time unknown"}{i.balancesUpdatedAt ? ` · retrieved ${formatDate(i.balancesUpdatedAt)}` : " · retrieval date unknown"}{i.status !== "healthy" ? ` · ${i.status === "needs_reauth" ? "Reconnect required" : "Sync failed"}: ${i.error ?? "See Settings"}` : ""}.</li>)}</ul></details>
  </div>;
}
