"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ACCOUNT_COOKIE } from "@/lib/account-filter";

// Global account filter control. Writing the cookie + router.refresh() makes
// every server page re-render scoped to the chosen account.

export interface AccountOption {
  id: string;
  name: string;
  mask: string | null;
  institution: string;
}

function setAccountCookie(id: string) {
  document.cookie = id
    ? `${ACCOUNT_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; samesite=lax`
    : `${ACCOUNT_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function AccountPicker({
  options,
  selected,
}: {
  options: AccountOption[];
  selected: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // group by institution for <optgroup>
  const groups = new Map<string, AccountOption[]>();
  for (const o of options) {
    if (!groups.has(o.institution)) groups.set(o.institution, []);
    groups.get(o.institution)!.push(o);
  }

  return (
    <div>
      <label htmlFor="account-picker" className="label-eyebrow mb-1.5 block">
        Viewing
      </label>
      <select
        id="account-picker"
        value={selected ?? ""}
        onChange={(e) => {
          setAccountCookie(e.target.value);
          startTransition(() => router.refresh());
        }}
        className={`w-full rounded-xl border hairline bg-surface px-3 py-2.5 text-sm outline-none transition-opacity focus:border-blue ${
          selected ? "border-blue text-blue" : "text-cream"
        } ${pending ? "opacity-60" : ""}`}
      >
        <option value="">All accounts</option>
        {[...groups.entries()].map(([inst, accts]) => (
          <optgroup key={inst} label={inst}>
            {accts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {a.mask ? ` ··${a.mask}` : ""}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

/** "View" action on the Accounts page: focus one account and jump to Overview. */
export function ViewAccountButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        setAccountCookie(id);
        router.push("/");
        router.refresh();
      }}
      className="shrink-0 rounded-lg border hairline px-2.5 py-1 text-xs text-cream-dim transition-colors hover:border-blue hover:text-blue"
    >
      View →
    </button>
  );
}
