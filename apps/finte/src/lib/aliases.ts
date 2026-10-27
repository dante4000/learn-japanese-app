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
  /** Optional: only fire when the charge's ACCOUNT name contains this lowercased
   *  substring. Disambiguates descriptors that are identical across cards — every
   *  Chase card posts its fee as the same "ANNUAL MEMBERSHIP FEE", so the account
   *  it lands on is the only thing that tells them apart. */
  account?: string;
}

const ALIASES: PayeeAlias[] = [
  // Chase posts every card's annual fee under the identical "ANNUAL MEMBERSHIP
  // FEE" descriptor, so the account is the only disambiguator. The World of
  // Hyatt fee ($95) must not be mistaken for the Sapphire Reserve fee ($550+);
  // the Hyatt-scoped alias is listed first so it wins for that account.
  { match: "annual membership fee", account: "hyatt", label: "World of Hyatt" },
  { match: "annual membership fee", label: "Sapphire Reserve" },
];

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

/**
 * The display name for a payee. Checks the merchant and the raw name/description
 * against the alias table; falls back to merchant, then raw name, then "Unknown".
 * Pass the charge's account name so account-scoped aliases (e.g. distinguishing
 * the Hyatt vs Sapphire Reserve "ANNUAL MEMBERSHIP FEE") can resolve correctly.
 */
export function displayPayee(
  merchant?: string | null,
  name?: string | null,
  account?: string | null,
): string {
  const m = norm(merchant);
  const n = norm(name);
  const acct = norm(account);
  for (const a of ALIASES) {
    if (a.match !== m && a.match !== n) continue;
    if (a.account && !acct.includes(a.account)) continue;
    return a.label;
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
  if (aliased !== (merchant || name || "Unknown")) return aliased.toUpperCase();

  let s = merchant?.trim() || name?.trim() || "";
  s = s.replace(/^\s*zelle\s+(payment\s+)?from\s+/i, "");
  s = s.replace(/^\s*(ach\s+credit|deposit|direct\s+dep(osit)?|dir\s+dep)\s+/i, "");
  const bankTransfer = /\btransfer\s+(?:ccd|ppd|web)\s*id\b/i.test(s);
  // Reference markers delimit bank metadata; digits in payer names remain.
  s = s.replace(/\b(?:ppd|ccd|web|co|conf|trace|ref)\s*id\b.*/i, "");
  s = s.replace(/\b(?:confirmation|reference|trace)(?:\s*(?:number|no\.?|#))?\s*[:#]?\s+[a-z0-9-]+\s*$/i, "");
  s = s.replace(/\bpay(?:ment)?\b\s*\d.*/i, "");
  s = s.replace(/\s+(?=[a-z0-9-]*\d)[a-z0-9-]{8,}\s*$/i, "");
  if (bankTransfer) s = s.replace(/\s+transfer\s*$/i, "");
  s = s.replace(/\s+(?:payroll|salary)\s*$/i, "");
  s = s.replace(/\s+/g, " ").replace(/[\s:;-]+$/, "").trim();
  const label = (s || aliased || "Unknown").toUpperCase();
  return /^RARELIQUID(?: LLC)?$/.test(label) ? "RARELIQUID" : label;
}
