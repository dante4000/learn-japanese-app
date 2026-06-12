import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  loadItemBundle,
  saveItemBundle,
  bundleForAccount,
} from "@/lib/store";
import { updateSnapshot } from "@/lib/sync";
import { csvToTransactions } from "@/lib/providers/csv";
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

  const csv = typeof body.csv === "string" ? body.csv : "";
  if (!csv.trim())
    return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

  const outflowSign =
    body.outflowSign === "positive_is_outflow"
      ? "positive_is_outflow"
      : "negative_is_outflow";
  const currency = (body.currency as string) || "USD";

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
      accountLabel =
        bundle.accounts.find((a) => a.id === accountId)?.name ?? "account";
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
      if (!bundle.accounts.some((a) => a.id === accountId)) {
        const balance =
          typeof body.currentBalance === "number"
            ? body.currentBalance
            : Number(body.currentBalance) || null;
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
    const existing = new Set(bundle.transactions.map((t) => t.id));
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
    await updateSnapshot();

    return NextResponse.json({
      ok: true,
      imported,
      skipped: result.skipped,
      account: accountLabel,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 },
    );
  }
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}
