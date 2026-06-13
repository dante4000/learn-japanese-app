"use client";

import { useRouter, useSearchParams } from "next/navigation";

/** Toggles ?src=<value> on the Income page to scope the whole tab to a single
 *  payer. Off by default (no param); flips the URL so the page re-renders the
 *  source-filtered view server-side. */
export function SourceToggle({
  value,
  label,
  active,
}: {
  value: string;
  label: string;
  active: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function toggle() {
    const next = new URLSearchParams(params.toString());
    if (active) next.delete("src");
    else next.set("src", value);
    const qs = next.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={active}
      className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-blue/40 bg-blue/15 text-blue"
          : "hairline bg-surface text-muted hover:text-cream"
      }`}
    >
      {label}
    </button>
  );
}
