// Plaid Personal Finance Category (PFC) primary taxonomy — the 16 top-level
// categories — mapped to friendly labels, an emoji glyph, and a stable color
// used across charts and the transaction feed.

export interface CategoryMeta {
  key: string;
  label: string;
  glyph: string;
  color: string;
  /** Spending categories count toward "spending"; transfers/income do not. */
  isSpending: boolean;
}

// A blue-anchored categorical palette — no greens or teals. Spans blues,
// indigos, violets, pinks, reds, oranges, ambers, and slates so the donut stays
// legible while keeping the overall blue identity.
export const CATEGORIES: Record<string, CategoryMeta> = {
  INCOME: { key: "INCOME", label: "Income", glyph: "💰", color: "#2563eb", isSpending: false },
  TRANSFER_IN: { key: "TRANSFER_IN", label: "Transfer In", glyph: "↘️", color: "#64748b", isSpending: false },
  TRANSFER_OUT: { key: "TRANSFER_OUT", label: "Transfer Out", glyph: "↗️", color: "#94a3b8", isSpending: false },
  LOAN_PAYMENTS: { key: "LOAN_PAYMENTS", label: "Loan Payments", glyph: "🏦", color: "#7c3aed", isSpending: false },
  BANK_FEES: { key: "BANK_FEES", label: "Bank Fees", glyph: "🧾", color: "#ef4444", isSpending: true },
  ENTERTAINMENT: { key: "ENTERTAINMENT", label: "Entertainment", glyph: "🎬", color: "#ec4899", isSpending: true },
  FOOD_AND_DRINK: { key: "FOOD_AND_DRINK", label: "Food & Drink", glyph: "🍔", color: "#f97316", isSpending: true },
  GENERAL_MERCHANDISE: { key: "GENERAL_MERCHANDISE", label: "Shopping", glyph: "🛍️", color: "#f59e0b", isSpending: true },
  HOME_IMPROVEMENT: { key: "HOME_IMPROVEMENT", label: "Home", glyph: "🔨", color: "#4f46e5", isSpending: true },
  MEDICAL: { key: "MEDICAL", label: "Medical", glyph: "⚕️", color: "#0ea5e9", isSpending: true },
  PERSONAL_CARE: { key: "PERSONAL_CARE", label: "Personal Care", glyph: "💅", color: "#d946ef", isSpending: true },
  GENERAL_SERVICES: { key: "GENERAL_SERVICES", label: "Services", glyph: "🛠️", color: "#3b82f6", isSpending: true },
  GOVERNMENT_AND_NON_PROFIT: { key: "GOVERNMENT_AND_NON_PROFIT", label: "Government & Charity", glyph: "🏛️", color: "#8b5cf6", isSpending: true },
  TRANSPORTATION: { key: "TRANSPORTATION", label: "Transportation", glyph: "🚗", color: "#0284c7", isSpending: true },
  TRAVEL: { key: "TRAVEL", label: "Travel", glyph: "✈️", color: "#6366f1", isSpending: true },
  RENT_AND_UTILITIES: { key: "RENT_AND_UTILITIES", label: "Rent & Utilities", glyph: "🏠", color: "#f43f5e", isSpending: true },
  OTHER: { key: "OTHER", label: "Other", glyph: "•", color: "#94a3b8", isSpending: true },
};

export function categoryMeta(key: string | null | undefined): CategoryMeta {
  if (!key) return CATEGORIES.OTHER;
  return CATEGORIES[key] ?? CATEGORIES.OTHER;
}

// Credit-card payments / autopay ACH transfers are money moving between your own
// accounts (checking → card), NOT spending or income — but aggregators often
// mislabel them (e.g. a Bilt rent autopay tagged "Rent", or a card payment
// credit tagged "Income"). Detect them by description so we can treat them as
// transfers and keep them out of spending/income totals. Anchored "Payment -"
// only matches when the name *starts* with it (a card-payment credit), so a
// real "Rent Payment - Landlord" outflow is left alone.
export function isInternalPayment(
  name: string,
  merchant?: string | null,
): boolean {
  const n = name || "";
  if (/^\s*payment\s*[-–]\s/i.test(n)) return true;
  const hay = `${n} ${merchant ?? ""}`;
  return /\bcard\b.{0,25}\bppd\b|\bcard\s*(pmt|payment|pymt)\b|\bcardmember\s+(pmt|payment)\b|\bautopay\b|payment\s+thank\s*you/i.test(
    hay,
  );
}

/** The effective category, accounting for user overrides and card-payment detection. */
export function resolveCategoryKey(t: {
  userCategory: string | null;
  categoryPrimary: string;
  name: string;
  merchantName: string | null;
  amount: number;
}): string {
  if (t.userCategory) return t.userCategory;
  if (isInternalPayment(t.name, t.merchantName))
    return t.amount >= 0 ? "TRANSFER_OUT" : "TRANSFER_IN";
  return t.categoryPrimary || "OTHER";
}

/** Categories that represent moving money between your own accounts, not spend. */
export const TRANSFER_CATEGORIES = new Set([
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "LOAN_PAYMENTS",
]);
