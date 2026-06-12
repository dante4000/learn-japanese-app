// Domain model for the single-user money tracker. Field names mirror Plaid's
// objects where possible so ingestion is a near 1:1 map. Money is stored as a
// JS number of major currency units (dollars), following Plaid's convention:
//
//   transaction.amount  →  POSITIVE = money OUT (debit), NEGATIVE = money IN.
//   account balances     →  current/available/limit as reported by source.

export type AccountType =
  | "depository"
  | "credit"
  | "loan"
  | "investment"
  | "other";

export type DataSource = "plaid" | "csv" | "manual";

/** One linked connection (a Plaid Item, or a CSV-import "pseudo-institution"). */
export interface Item {
  id: string;
  provider: DataSource;
  institutionName: string;
  /** AES-256-GCM encrypted Plaid access_token. Empty for csv/manual items. */
  accessTokenEnc: string;
  /** Plaid /transactions/sync cursor for incremental pulls. */
  cursor: string | null;
  status: "healthy" | "needs_reauth" | "error";
  error: string | null;
  lastSyncedAt: string | null; // ISO
  createdAt: string; // ISO
}

export interface AccountBalances {
  current: number | null;
  available: number | null;
  limit: number | null;
}

export interface Account {
  id: string;
  itemId: string;
  name: string;
  officialName: string | null;
  mask: string | null; // last 4
  type: AccountType;
  subtype: string | null; // checking, savings, credit card, mortgage, ...
  currency: string; // ISO 4217, e.g. USD
  balances: AccountBalances;
  source: DataSource;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number; // positive = outflow, negative = inflow
  currency: string;
  date: string; // ISO yyyy-mm-dd
  name: string; // raw description from the bank
  merchantName: string | null; // enriched merchant
  pending: boolean;
  /** Plaid Personal Finance Category primary, e.g. FOOD_AND_DRINK. */
  categoryPrimary: string;
  categoryDetailed: string | null;
  paymentChannel: string | null;
  source: DataSource;
  // ── user-authored overrides (never clobbered by re-sync) ──
  userCategory: string | null;
  note: string | null;
  hidden: boolean; // exclude from analytics (e.g. a transfer you don't want counted)
}

export type RecurringFrequency =
  | "WEEKLY"
  | "BIWEEKLY"
  | "SEMI_MONTHLY"
  | "MONTHLY"
  | "ANNUALLY"
  | "UNKNOWN";

export interface RecurringStream {
  id: string;
  accountId: string;
  description: string;
  merchantName: string | null;
  categoryPrimary: string;
  frequency: RecurringFrequency;
  averageAmount: number; // signed like transactions (positive = outflow)
  lastAmount: number;
  firstDate: string;
  lastDate: string;
  predictedNextDate: string | null;
  isActive: boolean;
  /** outflow = subscription/bill, inflow = income */
  type: "inflow" | "outflow";
  source: DataSource;
}

/** Manually-entered assets/liabilities (home value, car, etc.) for net worth. */
export interface ManualEntry {
  id: string;
  name: string;
  kind: "asset" | "liability";
  value: number;
  asOf: string; // ISO
}

export interface NetWorthSnapshot {
  date: string; // ISO yyyy-mm-dd
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

/** The entire persisted state for the one user. Stored as a single JSON blob. */
export interface AppState {
  version: number;
  items: Item[];
  accounts: Account[];
  transactions: Transaction[];
  recurring: RecurringStream[];
  manualEntries: ManualEntry[];
  snapshots: NetWorthSnapshot[];
  updatedAt: string | null;
}

/**
 * Per-connection bundle — the unit of persistence. Each Item (bank connection
 * or CSV import) is stored in its own blob, so writing one connection can never
 * clobber another (no lost-update race across banks).
 */
export interface ItemBundle {
  item: Item;
  accounts: Account[];
  transactions: Transaction[];
  recurring: RecurringStream[];
}

/** Global, non-connection data stored separately from item bundles. */
export interface MetaDoc {
  version: number;
  manualEntries: ManualEntry[];
  snapshots: NetWorthSnapshot[];
}

export function emptyMeta(): MetaDoc {
  return { version: 1, manualEntries: [], snapshots: [] };
}

export function emptyState(): AppState {
  return {
    version: 1,
    items: [],
    accounts: [],
    transactions: [],
    recurring: [],
    manualEntries: [],
    snapshots: [],
    updatedAt: null,
  };
}
