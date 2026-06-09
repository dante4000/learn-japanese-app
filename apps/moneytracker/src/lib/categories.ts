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

export const CATEGORIES: Record<string, CategoryMeta> = {
  INCOME: { key: "INCOME", label: "Income", glyph: "💰", color: "#22c55e", isSpending: false },
  TRANSFER_IN: { key: "TRANSFER_IN", label: "Transfer In", glyph: "↘️", color: "#64748b", isSpending: false },
  TRANSFER_OUT: { key: "TRANSFER_OUT", label: "Transfer Out", glyph: "↗️", color: "#64748b", isSpending: false },
  LOAN_PAYMENTS: { key: "LOAN_PAYMENTS", label: "Loan Payments", glyph: "🏦", color: "#a855f7", isSpending: false },
  BANK_FEES: { key: "BANK_FEES", label: "Bank Fees", glyph: "🧾", color: "#ef4444", isSpending: true },
  ENTERTAINMENT: { key: "ENTERTAINMENT", label: "Entertainment", glyph: "🎬", color: "#ec4899", isSpending: true },
  FOOD_AND_DRINK: { key: "FOOD_AND_DRINK", label: "Food & Drink", glyph: "🍔", color: "#f97316", isSpending: true },
  GENERAL_MERCHANDISE: { key: "GENERAL_MERCHANDISE", label: "Shopping", glyph: "🛍️", color: "#eab308", isSpending: true },
  HOME_IMPROVEMENT: { key: "HOME_IMPROVEMENT", label: "Home", glyph: "🔨", color: "#14b8a6", isSpending: true },
  MEDICAL: { key: "MEDICAL", label: "Medical", glyph: "⚕️", color: "#06b6d4", isSpending: true },
  PERSONAL_CARE: { key: "PERSONAL_CARE", label: "Personal Care", glyph: "💅", color: "#d946ef", isSpending: true },
  GENERAL_SERVICES: { key: "GENERAL_SERVICES", label: "Services", glyph: "🛠️", color: "#3b82f6", isSpending: true },
  GOVERNMENT_AND_NON_PROFIT: { key: "GOVERNMENT_AND_NON_PROFIT", label: "Government & Charity", glyph: "🏛️", color: "#8b5cf6", isSpending: true },
  TRANSPORTATION: { key: "TRANSPORTATION", label: "Transportation", glyph: "🚗", color: "#0ea5e9", isSpending: true },
  TRAVEL: { key: "TRAVEL", label: "Travel", glyph: "✈️", color: "#6366f1", isSpending: true },
  RENT_AND_UTILITIES: { key: "RENT_AND_UTILITIES", label: "Rent & Utilities", glyph: "🏠", color: "#f43f5e", isSpending: true },
  OTHER: { key: "OTHER", label: "Other", glyph: "•", color: "#94a3b8", isSpending: true },
};

export function categoryMeta(key: string | null | undefined): CategoryMeta {
  if (!key) return CATEGORIES.OTHER;
  return CATEGORIES[key] ?? CATEGORIES.OTHER;
}

/** Categories that represent moving money between your own accounts, not spend. */
export const TRANSFER_CATEGORIES = new Set([
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "LOAN_PAYMENTS",
]);
