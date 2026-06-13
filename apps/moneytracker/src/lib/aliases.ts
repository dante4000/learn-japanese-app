// User-defined display names for payees whose raw bank descriptor is unhelpful.
// Resolved at render time across every view (Activity, Recurring, Overview,
// Analysis), and used as the grouping key in aggregations, so a rename sticks
// through re-sync and covers both past and future charges. Single-user app:
// these are personal relabelings.

interface PayeeAlias {
  /** Lowercased raw descriptor, matched against a payee's merchantName OR its
   *  name/description. The first matching alias wins. */
  match: string;
  /** What to show instead. */
  label: string;
}

const ALIASES: PayeeAlias[] = [
  // Chase Sapphire Reserve $550 annual membership fee.
  { match: "annual membership fee", label: "Sapphire Reserve" },
];

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

/**
 * The display name for a payee. Checks the merchant and the raw name/description
 * against the alias table; falls back to merchant, then raw name, then "Unknown".
 */
export function displayPayee(
  merchant?: string | null,
  name?: string | null,
): string {
  const m = norm(merchant);
  const n = norm(name);
  for (const a of ALIASES) {
    if (a.match === m || a.match === n) return a.label;
  }
  return merchant || name || "Unknown";
}
