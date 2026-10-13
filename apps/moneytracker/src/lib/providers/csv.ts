import { createHash } from "node:crypto";
import { Transaction } from "../types";
import { CATEGORIES } from "../categories";

// Flexible CSV importer for bank/card exports (Chase, Amex, and most others).
// Auto-detects columns and normalizes the amount sign to our convention
// (POSITIVE = money out). Used as the zero-approval fallback while Plaid
// Production access is pending, and as a permanent manual backup.

/** Minimal RFC-4180-ish CSV parser that handles quoted fields and commas. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

interface ColumnMap {
  date: number;
  description: number;
  amount: number;
  debit: number;
  credit: number;
  category: number;
}

function findHeader(headers: string[], candidates: string[]): number {
  const norm = headers.map((h) => h.trim().toLowerCase());
  for (const cand of candidates) {
    const idx = norm.findIndex((h) => h === cand);
    if (idx !== -1) return idx;
  }
  // fuzzy contains
  for (const cand of candidates) {
    const idx = norm.findIndex((h) => h.includes(cand));
    if (idx !== -1) return idx;
  }
  return -1;
}

export function detectColumns(headers: string[]): ColumnMap {
  return {
    date: findHeader(headers, [
      "transaction date",
      "trans date",
      "date",
      "posting date",
      "post date",
    ]),
    description: findHeader(headers, [
      "description",
      "payee",
      "merchant",
      "name",
      "memo",
      "details",
    ]),
    amount: findHeader(headers, ["amount", "amt"]),
    debit: findHeader(headers, ["debit", "withdrawal", "withdrawals"]),
    credit: findHeader(headers, ["credit", "deposit", "deposits"]),
    category: findHeader(headers, ["category", "type"]),
  };
}

// Match complete words. Specific merchants precede broad category terms.
const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/\b(payroll|salary|direct dep(?:osit)?|gusto|adp)\b/i, "INCOME"],
  [/\b(transfer|zelle|venmo|cash app)\b/i, "TRANSFER_OUT"],
  [/\b(cvs|walgreens|pharmacy|hospital|clinic|dental|doctor|medical)\b/i, "MEDICAL"],
  [/\b(starbucks|coffee|restaurants?|caf[eé]|pizza|mcdonald'?s?|chipotle|doordash|grubhub|uber\s?eats|grocery|safeway|whole foods|trader joe'?s?)\b/i, "FOOD_AND_DRINK"],
  [/\b(?:car|vehicle|truck) rental\b|\brent[ -]a[ -]car\b/i, "TRAVEL"],
  [/\b(rent|landlord|mortgage|comcast|xfinity|at&t|verizon|t-mobile|pg&e|electric|water|gas company|utilit(?:y|ies))\b/i, "RENT_AND_UTILITIES"],
  [/\b(uber|lyft|shell|chevron|exxon|gas|fuel|parking|toll|metro|transit|bart)\b/i, "TRANSPORTATION"],
  [/\b(airlines?|airways|airbnb|hotels?|marriott|hilton|expedia|booking)\b/i, "TRAVEL"],
  [/\b(netflix|spotify|hulu|disney|hbo|cinema|amc|steam|playstation|xbox)\b/i, "ENTERTAINMENT"],
  [/\b(amazon|walmart|target|costco|ebay|etsy|best buy)\b/i, "GENERAL_MERCHANDISE"],
  [/\b(gym|salon|spa|barber|haircut)\b/i, "PERSONAL_CARE"],
  [/\b(insurance|attorney|legal|accounting|consulting)\b/i, "GENERAL_SERVICES"],
  [/\b(fees?|interest charge|overdraft)\b/i, "BANK_FEES"],
];

const CSV_CATEGORY_ALIASES: Record<string, string> = {
  groceries: "FOOD_AND_DRINK", "food and drink": "FOOD_AND_DRINK",
  "food and dining": "FOOD_AND_DRINK", dining: "FOOD_AND_DRINK",
  restaurants: "FOOD_AND_DRINK", "food and beverage": "FOOD_AND_DRINK",
  merchandise: "GENERAL_MERCHANDISE", "health and wellness": "MEDICAL",
  "gas and fuel": "TRANSPORTATION", gas: "TRANSPORTATION", "automotive": "TRANSPORTATION",
  bills: "RENT_AND_UTILITIES", utilities: "RENT_AND_UTILITIES", rent: "RENT_AND_UTILITIES",
  "bills and utilities": "RENT_AND_UTILITIES", "fees and adjustments": "BANK_FEES",
  payment: "TRANSFER_OUT", payments: "TRANSFER_OUT", transfer: "TRANSFER_OUT",
};

function categoryLabel(value: string): string {
  return value.toLowerCase().replace(/[_&]/g, " ").replace(/\band\b/g, " ").replace(/\s+/g, " ").trim();
}

const NORMALIZED_CSV_CATEGORIES = new Map([
  ...Object.entries(CSV_CATEGORY_ALIASES),
  ...Object.values(CATEGORIES).flatMap((c) => [[c.key, c.key], [c.label, c.key]]),
].map(([label, key]) => [categoryLabel(label), key]));

function csvCategory(value: string): string | undefined {
  return NORMALIZED_CSV_CATEGORIES.get(categoryLabel(value));
}

function guessCategory(description: string, amount: number, explicit: string): string {
  const category = csvCategory(explicit);
  if (category) return category === "TRANSFER_OUT" && amount < 0 ? "TRANSFER_IN" : category;
  for (const [re, cat] of CATEGORY_KEYWORDS) {
    if (re.test(description)) {
      if (cat === "INCOME" && amount > 0) continue;
      return cat === "TRANSFER_OUT" && amount < 0 ? "TRANSFER_IN" : cat;
    }
  }
  return amount < 0 ? "INCOME" : "OTHER";
}

/** CSV history must end before provider history begins for the same account. */
export function csvHistoryOverlap(
  providerHistory: readonly Transaction[],
  csvRows: readonly Transaction[],
  accountId: string,
): { firstPlaidDate: string | null; count: number } {
  let firstPlaidDate: string | null = null;
  for (const t of providerHistory) {
    if (t.accountId === accountId && t.source === "plaid" && (!firstPlaidDate || t.date < firstPlaidDate))
      firstPlaidDate = t.date;
  }
  const count = firstPlaidDate === null ? 0 : csvRows.filter((t) =>
    t.accountId === accountId && t.source === "csv" && t.date >= firstPlaidDate,
  ).length;
  return { firstPlaidDate, count };
}

export function csvOverlapError(existing: Transaction[], incoming: Transaction[], accountId: string): string | null {
  if (!incoming.length) return null;
  const { firstPlaidDate, count } = csvHistoryOverlap(existing, incoming, accountId);
  if (!firstPlaidDate) return "This linked account has no bank history yet. Sync it before importing older CSV history.";
  return count
    ? `${count} CSV row(s) fall within or after bank history starting ${firstPlaidDate}. No rows were imported. Use a file containing only earlier history to avoid duplicate charges.`
    : null;
}

function parseAmount(raw: string): number {
  if (!raw) return NaN;
  const cleaned = raw.replace(/[$,\s]/g, "").replace(/[()]/g, (m) =>
    m === "(" ? "-" : "",
  );
  return cleaned ? Number(cleaned) : NaN;
}

function validDate(iso: string): string | null {
  const date = new Date(iso + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : null;
}

function parseDate(raw: string): string | null {
  const s = raw.trim();
  // mm/dd/yyyy or m/d/yy
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const [, mm, dd, yyRaw] = slash;
    const yy = yyRaw.length === 2 ? "20" + yyRaw : yyRaw;
    return validDate(`${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`);
  }
  // yyyy-mm-dd
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return validDate(`${iso[1]}-${iso[2]}-${iso[3]}`);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

export interface CsvImportOptions {
  accountId: string;
  currency?: string;
  /**
   * How the file encodes spending.
   *  - "negative_is_outflow" (Chase/Amex bank exports): negative = money out.
   *  - "positive_is_outflow" (some card exports): positive = money out.
   * Our internal convention is positive = outflow, so we flip when needed.
   */
  outflowSign: "negative_is_outflow" | "positive_is_outflow";
}

export interface CsvImportResult {
  transactions: Transaction[];
  skipped: number;
  detected: ColumnMap;
}

export function csvToTransactions(
  text: string,
  opts: CsvImportOptions,
): CsvImportResult {
  const rows = parseCsv(text);
  if (rows.length < 2)
    return { transactions: [], skipped: 0, detected: detectColumns([]) };

  const headers = rows[0];
  const cols = detectColumns(headers);
  const currency = opts.currency ?? "USD";
  const transactions: Transaction[] = [];
  let skipped = 0;
  // How many identical (account|date|amount|description) rows we've already seen
  // in this file. Two genuinely distinct same-day charges with the same amount
  // and merchant (e.g. two $5 coffees) hash to the same content key; without an
  // occurrence index they'd collapse to one id and the import route's id-dedupe
  // would silently drop the second. The Nth occurrence gets a stable suffix, so
  // re-importing an overlapping export still dedupes occurrence-for-occurrence.
  const seen = new Map<string, number>();

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const dateRaw = cols.date >= 0 ? r[cols.date] : "";
    const date = parseDate(dateRaw || "");
    const description =
      (cols.description >= 0 ? r[cols.description] : "")?.trim() || "Transaction";

    // Resolve a signed amount in the FILE's convention first.
    let fileAmount: number;
    if (cols.amount >= 0 && r[cols.amount]?.trim()) {
      fileAmount = parseAmount(r[cols.amount]);
    } else if (cols.debit >= 0 || cols.credit >= 0) {
      const debit = cols.debit >= 0 ? parseAmount(r[cols.debit]) : NaN;
      const credit = cols.credit >= 0 ? parseAmount(r[cols.credit]) : NaN;
      // debit = money out (we'll treat as outflow), credit = money in
      if (!isNaN(debit) && debit !== 0)
        fileAmount = opts.outflowSign === "negative_is_outflow" ? -Math.abs(debit) : Math.abs(debit);
      else if (!isNaN(credit) && credit !== 0)
        fileAmount = opts.outflowSign === "negative_is_outflow" ? Math.abs(credit) : -Math.abs(credit);
      else fileAmount = NaN;
    } else {
      fileAmount = NaN;
    }

    if (!date || !Number.isFinite(fileAmount)) {
      skipped++;
      continue;
    }

    // Normalize to internal convention: POSITIVE = outflow.
    const amount =
      opts.outflowSign === "negative_is_outflow" ? -fileAmount : fileAmount;

    const contentKey = `${opts.accountId}|${date}|${amount}|${description}`;
    const occurrence = seen.get(contentKey) ?? 0;
    seen.set(contentKey, occurrence + 1);
    // The first occurrence keeps the legacy content-only hash so already-stored
    // transactions still dedupe on re-import; only the 2nd+ identical row gets a
    // distinguishing "#n" suffix.
    const id =
      "csv_" +
      createHash("sha1")
        .update(occurrence === 0 ? contentKey : `${contentKey}#${occurrence}`)
        .digest("hex")
        .slice(0, 24);

    transactions.push({
      id,
      accountId: opts.accountId,
      amount,
      currency,
      date,
      name: description,
      merchantName: null,
      pending: false,
      categoryPrimary: guessCategory(description, amount, cols.category >= 0 ? r[cols.category] ?? "" : ""),
      categoryDetailed: null,
      paymentChannel: null,
      source: "csv",
      userCategory: null,
      note: null,
      hidden: false,
    });
  }

  return { transactions, skipped, detected: cols };
}
