import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { mutateState } from "@/lib/store";
import { csvToTransactions } from "@/lib/providers/csv";
import { recordSnapshot } from "@/lib/analytics";
import { Account, AccountType, Item } from "@/lib/types";

// Import a bank/card CSV export. Either attach to an existing account or create
// a new CSV-backed account. Transactions are deduped by a content hash, so
// re-importing an overlapping file is safe.
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
    let imported = 0;
    let skipped = 0;
    let accountLabel = "";

    await mutateState((state) => {
      let accountId: string;

      if (body.mode === "existing" && typeof body.accountId === "string") {
        accountId = body.accountId;
        const acct = state.accounts.find((a) => a.id === accountId);
        if (!acct) throw new Error("Account not found");
        accountLabel = acct.name;
      } else {
        // Create a CSV pseudo-institution + account.
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

        if (!state.items.some((i) => i.id === itemId)) {
          const item: Item = {
            id: itemId,
            provider: "csv",
            institutionName,
            accessTokenEnc: "",
            cursor: null,
            status: "healthy",
            error: null,
            lastSyncedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          };
          state.items.push(item);
        }
        if (!state.accounts.some((a) => a.id === accountId)) {
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
          state.accounts.push(acct);
        }
        accountLabel = accountName;
      }

      const result = csvToTransactions(csv, { accountId, currency, outflowSign });
      skipped = result.skipped;

      const existing = new Set(state.transactions.map((t) => t.id));
      for (const t of result.transactions) {
        if (!existing.has(t.id)) {
          state.transactions.push(t);
          existing.add(t.id);
          imported++;
        }
      }
      state.transactions.sort((a, b) => b.date.localeCompare(a.date));
      recordSnapshot(state, new Date().toISOString().slice(0, 10));
    });

    return NextResponse.json({ ok: true, imported, skipped, account: accountLabel });
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
