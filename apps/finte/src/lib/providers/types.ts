import { Account, RecurringStream, Transaction } from "../types";

/** Normalized result of pulling fresh data from any aggregator/source. */
export interface SyncResult {
  institutionName?: string;
  accounts: Account[];
  /** True after a successful full account response, including an empty result. */
  accountsComplete?: boolean;
  balanceSource?: "live" | "cached";
  balanceWarning?: string;
  transactionError?: { status: "needs_reauth" | "error"; message: string };
  added: Transaction[];
  modified: Transaction[];
  removed: string[]; // transaction ids that no longer exist
  recurring: RecurringStream[] | null;
  cursor: string | null;
}

export function emptySyncResult(): SyncResult {
  return {
    accounts: [],
    added: [],
    modified: [],
    removed: [],
    recurring: [],
    cursor: null,
  };
}
