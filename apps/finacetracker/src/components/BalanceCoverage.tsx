import type { AppState } from "@/lib/types";
import { computeNetWorth } from "@/lib/analytics";
import { formatMoney, formatDate } from "@/lib/format";
import { DetailLink } from "./DetailPanel";

export function BalanceCoverage({ state }: { state: AppState }) {
  const nw = computeNetWorth(state);
  const warnings = state.items.filter((i) => i.balanceWarning);
  if (nw.complete && !warnings.length) return null;
  return <aside className="my-4 rounded-xl border hairline bg-surface p-4 text-sm text-muted" aria-label="Balance coverage">
    {!nw.complete && <><p className="font-semibold text-cream">Partial balance total · {nw.currency}</p><p>Totals include known balances only. Missing balances do not mean zero assets or zero debt.</p><ul className="mt-2 space-y-2">{nw.missingAccounts.map((a) => <li key={a.id}><DetailLink query={{ metric: "account", account: a.id }}>{a.name}</DetailLink>: balance unavailable.{a.lastReportedBalances?.current != null && <> Last reported: {formatMoney(a.lastReportedBalances.current, a.currency)}{a.lastReportedAt ? ` on ${formatDate(a.lastReportedAt.slice(0, 10))}` : " (date unavailable)"}.</>}</li>)}</ul></>}
    {warnings.map((i) => <p key={i.id} className="mt-2">{i.institutionName}: {i.balanceWarning}{i.balancesUpdatedAt ? ` Last successful balance refresh: ${formatDate(i.balancesUpdatedAt.slice(0, 10))}.` : ""}</p>)}
  </aside>;
}
