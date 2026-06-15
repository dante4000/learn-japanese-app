import { UpcomingBill } from "@/lib/analytics";
import { categoryMeta } from "@/lib/categories";
import { formatMoney } from "@/lib/format";

function dayLabel(d: number): string {
  if (d <= 0) return "due today";
  if (d === 1) return "tomorrow";
  return `in ${d} days`;
}

function dateBadge(iso: string): { mon: string; day: string } {
  const [y, m, d] = iso.split("-").map(Number);
  const mon = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    new Date(y, m - 1, d),
  );
  return { mon: mon.toUpperCase(), day: String(d) };
}

export function UpcomingBills({
  bills,
  dueSoonTotal,
  currency = "USD",
}: {
  bills: UpcomingBill[];
  dueSoonTotal: number;
  currency?: string;
}) {
  if (!bills.length)
    return (
      <p className="py-8 text-center text-sm text-muted">
        No upcoming bills detected yet — needs a few months of recurring history.
      </p>
    );

  return (
    <div>
      <div className="mb-4 rounded-xl border hairline bg-surface px-4 py-3">
        <div className="label-eyebrow">Due in the next 30 days</div>
        <div className="tnum mt-1 text-2xl text-coral">
          {formatMoney(dueSoonTotal, currency, { cents: false })}
        </div>
      </div>

      <ul className="space-y-2">
        {bills.map((b) => {
          const meta = categoryMeta(b.categoryPrimary);
          const badge = dateBadge(b.nextDate);
          const urgent = b.daysUntil <= 3;
          return (
            <li
              key={b.id}
              className="flex items-center gap-3 rounded-xl border hairline bg-surface px-3 py-2.5"
            >
              <div className="flex w-11 shrink-0 flex-col items-center">
                <span className="text-[0.55rem] font-semibold uppercase tracking-wider text-faint">
                  {badge.mon}
                </span>
                <span className="tnum text-xl leading-none text-cream">
                  {badge.day}
                </span>
              </div>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border hairline bg-surface-2">
                {meta.glyph}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm text-cream">{b.name}</div>
                <div className="text-xs text-faint">
                  <span className={urgent ? "text-coral" : "text-muted"}>
                    {dayLabel(b.daysUntil)}
                  </span>
                  {" · "}
                  <span className="capitalize">
                    {b.frequency.toLowerCase().replace("_", " ")}
                  </span>
                  {b.predicted ? " · est." : ""}
                </div>
              </div>
              <span className="tnum ml-auto text-sm text-cream">
                {formatMoney(b.amount, currency)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
