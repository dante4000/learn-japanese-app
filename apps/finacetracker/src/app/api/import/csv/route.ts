import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  StorageConflictError,
  loadItemBundle,
  saveItemBundle,
  bundleForAccount,
} from "@/lib/store";
import { refreshSnapshotAfterMutation } from "@/lib/sync";
import { csvToTransactions, csvOverlapError } from "@/lib/providers/csv";
import { Account, AccountType, Item, ItemBundle } from "@/lib/types";

// Import a bank/card CSV export. Either attach to an existing account or create
// a new CSV-backed account. Transactions are deduped by a content hash, so
// re-importing an overlapping file is safe. Writes only the owning item's
// bundle.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body))
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  for (const key of ["currency", "institutionName", "accountName", "accountId"]) {
    if (body[key] != null && typeof body[key] !== "string")
      return NextResponse.json({ error: `Invalid ${key}` }, { status: 400 });
  }
  if (body.currency != null && !/^[A-Z]{3}$/.test(body.currency as string))
    return NextResponse.json({ error: "Currency must be a three-letter code" }, { status: 400 });

  const csv = typeof body.csv === "string" ? body.csv : "";
  if (!csv.trim())
    return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

  const outflowSign =
    body.outflowSign === "positive_is_outflow"
      ? "positive_is_outflow"
      : "negative_is_outflow";
  let currency = (body.currency as string) || "USD";

  try {
    let bundle: ItemBundle;
    let accountId: string;
    let accountLabel: string;

    if (body.mode === "existing" && typeof body.accountId === "string") {
      const found = await bundleForAccount(body.accountId);
      if (!found)
        return NextResponse.json({ error: "Account not found" }, { status: 400 });
      bundle = found;
      accountId = body.accountId;
      const account = bundle.accounts.find((a) => a.id === accountId)!;
      accountLabel = account.name;
      currency = account.currency;
    } else {
      const institutionName = (body.institutionName as string) || "Imported";
      const accountName = (body.accountName as string) || "Imported Account";
      const accountType = ([
        "depository",
        "credit",
        "loan",
        "investment",
      ].includes(body.accountType as string)
        ? body.accountType
        : "depository") as AccountType;
      const itemId = "csvitem_" + Math.abs(hashStr(institutionName + accountName));
      accountId = "csvacct_" + Math.abs(hashStr(itemId + accountName));
      accountLabel = accountName;

      // Reuse an existing CSV item/account if re-importing into the same one.
      bundle = (await loadItemBundle(itemId)) ?? {
        item: {
          id: itemId,
          provider: "csv",
          institutionName,
          accessTokenEnc: "",
          cursor: null,
          status: "healthy",
          error: null,
          lastSyncedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        } as Item,
        accounts: [],
        transactions: [],
        recurring: [],
      };
      const balance = parseBalance(body.currentBalance);
      const existingAcct = bundle.accounts.find((a) => a.id === accountId);
      if (existingAcct) {
        // Re-import into the same CSV account: refresh the balance if provided
        // so it doesn't go stale forever after the first import.
        if (balance !== null) existingAcct.balances.current = balance;
      } else {
        const acct: Account = {
          id: accountId,
          itemId,
          name: accountName,
          officialName: null,
          mask: null,
          type: accountType,
          subtype: null,
          currency,
          balances: { current: balance, available: null, limit: null },
          source: "csv",
        };
        bundle.accounts.push(acct);
      }
    }

    const result = csvToTransactions(csv, { accountId, currency, outflowSign });
    if (!result.transactions.length)
      return NextResponse.json({ error: "No valid transactions found. Check the date, amount, and description columns.", skipped: result.skipped }, { status: 400 });
    const existing = new Set(bundle.transactions.map((t) => t.id));
    const incoming = result.transactions.filter((t) => !existing.has(t.id));
    if (bundle.item.provider === "plaid") {
      const overlap = csvOverlapError(bundle.transactions, incoming, accountId);
      if (overlap) return NextResponse.json({ error: overlap }, { status: 409 });
    }
    let imported = 0;
    for (const t of result.transactions) {
      if (!existing.has(t.id)) {
        bundle.transactions.push(t);
        existing.add(t.id);
        imported++;
      }
    }
    bundle.transactions.sort((a, b) => b.date.localeCompare(a.date));

    await saveItemBundle(bundle);
    const snapshot = await refreshSnapshotAfterMutation();

    return NextResponse.json({
      ok: true,
      imported,
      skipped: result.skipped,
      account: accountLabel,
      ...snapshot,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: err instanceof StorageConflictError ? 409 : 500 },
    );
  }
}

/** Number or numeric string → number; anything else → null. Preserves 0. */
function parseBalance(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}
