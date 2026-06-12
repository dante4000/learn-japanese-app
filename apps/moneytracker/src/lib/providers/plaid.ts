import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  Transaction as PlaidTransaction,
  AccountBase,
  TransactionStream,
} from "plaid";
import {
  Account,
  AccountType,
  Item,
  RecurringStream,
  Transaction,
} from "../types";
import { SyncResult } from "./types";
import { decrypt } from "../crypto";

// Plaid integration. The access token is decrypted only here, in server code,
// and is never returned to the client.

let cached: PlaidApi | null = null;

export function plaidConfigured(): boolean {
  return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}

export function plaidClient(): PlaidApi {
  if (cached) return cached;
  const env = (process.env.PLAID_ENV || "sandbox") as keyof typeof PlaidEnvironments;
  const config = new Configuration({
    basePath: PlaidEnvironments[env] ?? PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  });
  cached = new PlaidApi(config);
  return cached;
}

/** Extract Plaid's real error_code/error_message from a failed SDK call. */
export function plaidErrorMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { error_message?: string; error_code?: string } };
    message?: string;
  };
  const d = e?.response?.data;
  if (d?.error_message)
    return d.error_code ? `${d.error_code}: ${d.error_message}` : d.error_message;
  return e?.message || "Plaid request failed";
}

/** Create a Link token to open Plaid Link on the client. */
export async function createLinkToken(): Promise<string> {
  const client = plaidClient();
  const base = process.env.APP_BASE_URL?.replace(/\/$/, "");
  // Only send a redirect_uri once it's registered in the Plaid Dashboard
  // (API → Allowed redirect URIs). It's required for OAuth banks like Chase in
  // production, but sending an unregistered URI makes Plaid reject the request,
  // so we gate it behind an explicit env var. Sandbox/non-OAuth links don't
  // need it.
  const redirectUri = process.env.PLAID_REDIRECT_URI;
  const res = await client.linkTokenCreate({
    user: { client_user_id: "owner" }, // single user
    client_name: "Money Tracker",
    products: [Products.Transactions],
    // Plaid defaults to 90 days of history; ask for the max (24 months).
    // Fixed per Item at link time — already-linked banks must be re-linked
    // to backfill older transactions.
    transactions: { days_requested: 730 },
    country_codes: [CountryCode.Us],
    language: "en",
    ...(redirectUri ? { redirect_uri: redirectUri } : {}),
    ...(base ? { webhook: `${base}/api/plaid/webhook` } : {}),
  });
  return res.data.link_token;
}

export async function exchangePublicToken(
  publicToken: string,
): Promise<{ accessToken: string; itemId: string }> {
  const client = plaidClient();
  const res = await client.itemPublicTokenExchange({
    public_token: publicToken,
  });
  return { accessToken: res.data.access_token, itemId: res.data.item_id };
}

export async function getInstitutionName(accessToken: string): Promise<string> {
  const client = plaidClient();
  try {
    const itemRes = await client.itemGet({ access_token: accessToken });
    const instId = itemRes.data.item.institution_id;
    if (!instId) return "Bank";
    const inst = await client.institutionsGetById({
      institution_id: instId,
      country_codes: [CountryCode.Us],
    });
    return inst.data.institution.name;
  } catch {
    return "Bank";
  }
}

function mapAccountType(t: string): AccountType {
  if (["depository", "credit", "loan", "investment"].includes(t))
    return t as AccountType;
  return "other";
}

function mapAccount(a: AccountBase, itemId: string): Account {
  return {
    id: a.account_id,
    itemId,
    name: a.name,
    officialName: a.official_name ?? null,
    mask: a.mask ?? null,
    type: mapAccountType(a.type),
    subtype: a.subtype ?? null,
    currency: a.balances.iso_currency_code ?? "USD",
    balances: {
      current: a.balances.current ?? null,
      available: a.balances.available ?? null,
      limit: a.balances.limit ?? null,
    },
    source: "plaid",
  };
}

function mapTransaction(t: PlaidTransaction): Transaction {
  return {
    id: t.transaction_id,
    accountId: t.account_id,
    amount: t.amount, // Plaid: positive = outflow (matches our convention)
    currency: t.iso_currency_code ?? "USD",
    date: t.date,
    name: t.name,
    merchantName: t.merchant_name ?? null,
    pending: t.pending,
    categoryPrimary: t.personal_finance_category?.primary ?? "OTHER",
    categoryDetailed: t.personal_finance_category?.detailed ?? null,
    paymentChannel: t.payment_channel ?? null,
    source: "plaid",
    userCategory: null,
    note: null,
    hidden: false,
  };
}

function mapStream(s: TransactionStream, type: "inflow" | "outflow"): RecurringStream {
  return {
    id: s.stream_id,
    accountId: s.account_id,
    description: s.description,
    merchantName: s.merchant_name ?? null,
    categoryPrimary: s.personal_finance_category?.primary ?? "OTHER",
    frequency: (s.frequency as RecurringStream["frequency"]) ?? "UNKNOWN",
    averageAmount: s.average_amount?.amount ?? 0,
    lastAmount: s.last_amount?.amount ?? 0,
    firstDate: s.first_date,
    lastDate: s.last_date,
    predictedNextDate:
      (s as unknown as { predicted_next_date?: string }).predicted_next_date ??
      null,
    isActive: s.is_active,
    type,
    source: "plaid",
  };
}

/** Pull incremental transaction updates + current balances + recurring streams. */
export async function plaidSync(item: Item): Promise<SyncResult> {
  const client = plaidClient();
  const accessToken = decrypt(item.accessTokenEnc);

  const added: Transaction[] = [];
  const modified: Transaction[] = [];
  const removed: string[] = [];
  let cursor = item.cursor ?? undefined;
  let hasMore = true;
  let accounts: Account[] = [];

  // /transactions/sync pages through changes since the stored cursor.
  while (hasMore) {
    const res = await client.transactionsSync({
      access_token: accessToken,
      cursor,
      count: 500,
    });
    const data = res.data;
    added.push(...data.added.map(mapTransaction));
    modified.push(...data.modified.map(mapTransaction));
    removed.push(...data.removed.map((r) => r.transaction_id).filter(Boolean) as string[]);
    accounts = data.accounts.map((a) => mapAccount(a, item.id));
    cursor = data.next_cursor;
    hasMore = data.has_more;
  }

  // /transactions/sync's accounts array is unreliable (observed empty on
  // no-change syncs, which once wiped every persisted account and blanked the
  // whole dashboard). /accounts/get is the authoritative source — use it, and
  // only fall back to the sync payload if it errors.
  try {
    const acctRes = await client.accountsGet({ access_token: accessToken });
    accounts = acctRes.data.accounts.map((a) => mapAccount(a, item.id));
  } catch {
    // keep whatever the sync pages reported
  }

  // Recurring streams (subscriptions/bills + income). Best-effort: skip on error
  // (e.g. product not enabled) so a sync still delivers transactions.
  let recurring: RecurringStream[] = [];
  try {
    const rec = await client.transactionsRecurringGet({
      access_token: accessToken,
    });
    recurring = [
      ...rec.data.inflow_streams.map((s) => mapStream(s, "inflow")),
      ...rec.data.outflow_streams.map((s) => mapStream(s, "outflow")),
    ];
  } catch {
    recurring = [];
  }

  return {
    accounts,
    added,
    modified,
    removed,
    recurring,
    cursor: cursor ?? null,
  };
}
