import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { loadItemBundle, deleteItemBundle, StorageConflictError } from "@/lib/store";
import { refreshSnapshotAfterMutation } from "@/lib/sync";
import { removePlaidItem } from "@/lib/providers/plaid";
import { decrypt } from "@/lib/crypto";

// Delete the stored revision before revoking. A stale request must not revoke
// a connection that a concurrent edit or sync preserved.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const bundle = await loadItemBundle(id);
  if (!bundle) return NextResponse.json({ ok: true });

  let warning: string | undefined;
  try {
    ({ warning } = await deleteItemBundle(id, bundle));
  } catch (error) {
    if (error instanceof StorageConflictError) return NextResponse.json({ error: "Data changed while saving. Refresh and try again." }, { status: 409 });
    throw error;
  }
  if (bundle.item.provider === "plaid" && bundle.item.accessTokenEnc) {
    try {
      await removePlaidItem(decrypt(bundle.item.accessTokenEnc));
    } catch {
      // Local deletion succeeded. Do not retain credentials for a failed revoke.
    }
  }

  const snapshot = await refreshSnapshotAfterMutation();
  warning = [warning, snapshot.warning].filter(Boolean).join(" ") || undefined;
  return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
}
