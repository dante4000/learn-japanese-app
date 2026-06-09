import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { mutateState } from "@/lib/store";
import { plaidClient } from "@/lib/providers/plaid";
import { decrypt } from "@/lib/crypto";

// Remove a connection: revoke the Plaid item (so the token can't be reused),
// then delete its accounts, transactions, and recurring streams locally.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await mutateState(async (state) => {
    const item = state.items.find((i) => i.id === id);
    if (!item) return;

    if (item.provider === "plaid" && item.accessTokenEnc) {
      try {
        await plaidClient().itemRemove({
          access_token: decrypt(item.accessTokenEnc),
        });
      } catch {
        // best-effort revocation; still purge locally
      }
    }

    const accountIds = new Set(
      state.accounts.filter((a) => a.itemId === id).map((a) => a.id),
    );
    state.accounts = state.accounts.filter((a) => a.itemId !== id);
    state.transactions = state.transactions.filter(
      (t) => !accountIds.has(t.accountId),
    );
    state.recurring = state.recurring.filter(
      (r) => !accountIds.has(r.accountId),
    );
    state.items = state.items.filter((i) => i.id !== id);
  });

  return NextResponse.json({ ok: true });
}
