"use client";

import { useRouter } from "next/navigation";
import { ACCOUNT_COOKIE, LEGACY_ACCOUNT_COOKIE } from "@/lib/account-filter";
import { CURRENCY_COOKIE } from "@/lib/currency";
import { useSelectionTransition } from "./LoadingFeedback";

export function CurrencyPicker({ currencies, selected }: { currencies: string[]; selected: string }) {
  const router = useRouter();
  const [pending, start] = useSelectionTransition();
  if (currencies.length < 2) return null;
  return <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border hairline bg-surface p-3 text-sm">
    <label className="flex items-center gap-2">Currency
      <select aria-label="Analytics currency" disabled={pending} value={selected} className="min-h-11 rounded-lg border hairline bg-surface px-3 text-cream" onChange={(event) => {
        const currency = event.target.value;
        start(() => { document.cookie = `${ACCOUNT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`; document.cookie = `${LEGACY_ACCOUNT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`; document.cookie = `${CURRENCY_COOKIE}=${currency}; Path=/; Max-Age=31536000; SameSite=Lax`; router.refresh(); });
      }}>{currencies.map((c) => <option key={c} value={c}>{c}</option>)}</select>
    </label>
    <p className="text-muted">Analytics show {selected} only. Currencies are not converted or added together. Accounts lists every currency.</p>
  </div>;
}
