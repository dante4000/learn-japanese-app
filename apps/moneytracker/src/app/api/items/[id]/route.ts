import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { loadItemBundle, deleteItemBundle } from "@/lib/store";
import { updateSnapshot } from "@/lib/sync";
import { plaidClient } from "@/lib/providers/plaid";
import { decrypt } from "@/lib/crypto";

// Remove a connection: revoke the Plaid item (so the token can't be reused),
// then delete its bundle (accounts, transactions, recurring) entirely.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const bundle = await loadItemBundle(id);
  if (!bundle) return NextResponse.json({ ok: true });

  if (bundle.item.provider === "plaid" && bundle.item.accessTokenEnc) {
    try {
      await plaidClient().itemRemove({
        access_token: decrypt(bundle.item.accessTokenEnc),
      });
    } catch {
      // best-effort revocation; still purge locally
    }
  }

  await deleteItemBundle(id);
  await updateSnapshot();
  return NextResponse.json({ ok: true });
}
