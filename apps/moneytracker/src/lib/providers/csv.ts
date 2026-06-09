import { createHash } from "node:crypto";
import { Transaction } from "../types";

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

// Keyword → Plaid PFC primary, so CSV imports aren't all "Other".
const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/payroll|salary|direct dep|direct deposit|gusto|adp/i, "INCOME"],
  [/uber|lyft|shell|chevron|exxon|gas|fuel|parking|toll|metro|transit|bart/i, "TRANSPORTATION"],
  [/airlines|delta|united|airbnb|hotel|marriott|hilton|expedia|booking/i, "TRAVEL"],
  [/netflix|spotify|hulu|disney|hbo|cinema|amc|steam|playstation|xbox/i, "ENTERTAINMENT"],
  [/starbucks|coffee|restaurant|cafe|pizza|mcdonald|chipotle|doordash|grubhub|ubereats|grocery|safeway|whole foods|trader joe/i, "FOOD_AND_DRINK"],
  [/amazon|walmart|target|costco|ebay|etsy|best buy|store/i, "GENERAL_MERCHANDISE"],
  [/rent|landlord|mortgage|comcast|xfinity|at&t|verizon|t-mobile|pg&e|electric|water|gas company|utility/i, "RENT_AND_UTILITIES"],
  [/cvs|walgreens|pharmacy|hospital|clinic|dental|doctor|medical/i, "MEDICAL"],
  [/gym|salon|spa|barber|haircut/i, "PERSONAL_CARE"],
  [/insurance|attorney|legal|accounting|consulting/i, "GENERAL_SERVICES"],
  [/fee|interest charge|overdraft/i, "BANK_FEES"],
  [/transfer|zelle|venmo|paypal|cash app/i, "TRANSFER_OUT"],
];

function guessCategory(description: string, amount: number): string {
  for (const [re, cat] of CATEGORY_KEYWORDS) {
    if (re.test(description)) {
      if (cat === "INCOME" && amount > 0) continue; // income should be inflow
      return cat;
    }
  }
  return amount < 0 ? "INCOME" : "OTHER";
}

function parseAmount(raw: string): number {
  if (!raw) return NaN;
  const cleaned = raw.replace(/[$,\s]/g, "").replace(/[()]/g, (m) =>
    m === "(" ? "-" : "",
  );
  return parseFloat(cleaned);
}

function parseDate(raw: string): string | null {
  const s = raw.trim();
  // mm/dd/yyyy or m/d/yy
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const [, mm, dd, yyRaw] = slash;
    const yy = yyRaw.length === 2 ? "20" + yyRaw : yyRaw;
    return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  // yyyy-mm-dd
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
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

    if (!date || isNaN(fileAmount)) {
      skipped++;
      continue;
    }

    // Normalize to internal convention: POSITIVE = outflow.
    const amount =
      opts.outflowSign === "negative_is_outflow" ? -fileAmount : fileAmount;

    const id =
      "csv_" +
      createHash("sha1")
        .update(`${opts.accountId}|${date}|${amount}|${description}`)
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
      categoryPrimary: guessCategory(description, amount),
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
