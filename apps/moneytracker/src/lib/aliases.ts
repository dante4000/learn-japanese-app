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

/**
 * A normalized grouping label for an income payer. Bank inflow descriptors carry
 * per-payment reference noise — Zelle confirmation numbers, ACH "PPD ID" trace
 * tags, random alphanumeric tokens — so the same payer (a paycheck, a client)
 * shows up under dozens of distinct strings and shatters the income breakdown
 * (e.g. every "Zelle payment from RARELIQUID LLC <id>" counted as its own
 * source, with the long tail dumped into a giant "Other"). Strip that noise so
 * all payments from one payer collapse together. Explicit aliases still win.
 */
export function incomeSourceLabel(
  merchant?: string | null,
  name?: string | null,
): string {
  const aliased = displayPayee(merchant, name);
  // An alias fired — trust it verbatim.
  if (aliased !== (merchant || name || "Unknown")) return aliased;

  let s = merchant?.trim() || name?.trim() || "";
  s = s.replace(/^\s*zelle\s+(payment\s+)?from\s+/i, "");
  s = s.replace(/^\s*(ach\s+credit|deposit|direct\s+dep(osit)?|dir\s+dep)\s+/i, "");
  // Drop everything from a reference marker onward ("… PPD ID: 9138864001").
  s = s.replace(/\b(ppd|web|co|conf|trace|ref)\s*id\b.*/i, "");
  // Drop a trailing "PAY"/"PAYMENT" followed by reference numbers.
  s = s.replace(/\bpay(ment)?\b\s*\d.*/i, "");
  // Remove any leftover token containing a digit (confirmation #s, gibberish).
  s = s.replace(/\b\S*\d\S*\b/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  return s || aliased || "Unknown";
}
