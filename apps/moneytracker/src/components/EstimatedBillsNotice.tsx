import { DetailLink } from "./DetailPanel";
import Link from "@/components/AppLink";
import { isSpend, isSyntheticBaseline } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { AppState } from "@/lib/types";

/** Keep inferred bills visible beside totals that include them. */
export function EstimatedBillsNotice({ state, months, currency }: {
  state: AppState;
  months: string[];
  currency: string;
}) {
  const selected = new Set(months);
  let estimated = 0;
  let recorded = 0;
  for (const t of state.transactions) {
    if (!selected.has(t.date.slice(0, 7)) || !isSpend(t)) continue;
    if (isSyntheticBaseline(t)) estimated += t.amount;
    else recorded += t.amount;
  }
  if (!estimated) return null;
  return <p className="mb-5 rounded-xl border hairline bg-surface p-3 text-sm text-muted">
    Spending includes <span className="tnum text-cream"><DetailLink query={{ metric: "spending", months, part: "estimates" }}>{formatMoney(estimated, currency)}</DetailLink></span> in estimated bills.
    Recorded spending is <span className="tnum text-cream"><DetailLink query={{ metric: "spending", months, part: "recorded" }}>{formatMoney(recorded, currency)}</DetailLink></span>.{" "}
    <Link className="inline-flex min-h-11 items-center text-blue underline" href="/recurring">Review bill dates and amounts</Link>.
  </p>;
}
