import { Account, RecurringStream, Transaction } from "../types";

/** Normalized result of pulling fresh data from any aggregator/source. */
export interface SyncResult {
  institutionName?: string;
  accounts: Account[];
  added: Transaction[];
  modified: Transaction[];
  removed: string[]; // transaction ids that no longer exist
  recurring: RecurringStream[];
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
