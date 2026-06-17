"use client";

import { useRouter, useSearchParams } from "next/navigation";

/** Switches one phantom income source (rent you never see in the feed) on or
 *  off via its own URL key — ?<paramKey>=on — so the Income page re-renders with
 *  the imputed source server-side. Off by default. Each source gets its own
 *  button, mirroring the Spending tab's rent toggle. */
export function PhantomIncomeToggle({
  paramKey,
  label,
  monthly,
  active,
}: {
  paramKey: string;
  label: string;
  monthly: number;
  active: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function toggle() {
    const next = new URLSearchParams(params.toString());
    if (active) next.delete(paramKey);
    else next.set(paramKey, "on");
    const qs = next.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={active}
      title={`Phantom $${monthly.toLocaleString()}/mo — ${label}, covered on your behalf so it never hits your bank feed`}
      className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-blue/40 bg-blue/15 text-blue"
          : "hairline bg-surface text-muted hover:text-cream"
      }`}
    >
      {active ? `${label} +$${monthly.toLocaleString()}` : `+ ${label}`}
    </button>
  );
}
