import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { loadItemBundle, deleteItemBundle, StorageConflictError } from "@/lib/store";
import { refreshSnapshotAfterMutation } from "@/lib/sync";
import { revokeRemovedConnection } from "@/lib/providers/plaid";

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
  const revokeWarning = await revokeRemovedConnection(bundle.item);
  warning = [warning, revokeWarning].filter(Boolean).join(" ") || undefined;

  const snapshot = await refreshSnapshotAfterMutation();
  warning = [warning, snapshot.warning].filter(Boolean).join(" ") || undefined;
  return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
}
