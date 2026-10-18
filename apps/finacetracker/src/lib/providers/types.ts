import { Account, RecurringStream, Transaction } from "../types";

/** Normalized result of pulling fresh data from any aggregator/source. */
export interface SyncResult {
  institutionName?: string;
  accounts: Account[];
  /** True only after a successful /accounts/get, including an empty result. */
  accountsComplete?: boolean;
  balanceWarning?: string;
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
