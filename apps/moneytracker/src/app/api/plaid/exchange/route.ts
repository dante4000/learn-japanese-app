import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  exchangePublicToken,
  getInstitutionIdentity,
  connectedInstitution,
  removePlaidItem,
  plaidErrorMessage,
} from "@/lib/providers/plaid";
import { encrypt } from "@/lib/crypto";
import {
  loadState, loadItemBundle, saveItemBundle, StorageConflictError,
  reserveInstitution, releaseInstitution, InstitutionReservation,
} from "@/lib/store";
import { syncOneItem, refreshSnapshotAfterMutation } from "@/lib/sync";
import { Item } from "@/lib/types";

// Completes the Plaid Link flow: exchange the public_token for a permanent
// access_token, persist the connection immediately (so it can't be lost if the
// first historical sync is slow), then pull its data.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let publicToken = "";
  try {
    const body = await req.json();
    publicToken = typeof body?.public_token === "string" ? body.public_token : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!publicToken)
    return NextResponse.json({ error: "Missing public_token" }, { status: 400 });

  let unusedToken: string | null = null;
  let candidateItemId: string | null = null;
  let reservation: InstitutionReservation | null = null;
  let writeMayHaveCommitted = false;
  try {
    const state = await loadState();
    const { accessToken, itemId } = await exchangePublicToken(publicToken);
    const existing = state.items.find((item) => item.id === itemId);
    if (existing)
      return NextResponse.json({ ok: true, institutionName: existing.institutionName, alreadyConnected: true });
    unusedToken = accessToken;
    candidateItemId = itemId;
    const institution = await getInstitutionIdentity(accessToken);
    const duplicate = await connectedInstitution(state.items, institution.id);
    if (duplicate)
      return NextResponse.json({ error: `${duplicate.institutionName} is already connected. This new link was not saved because it could duplicate accounts and transactions. Keep the existing connection; reconnecting requires account reconciliation.` }, { status: 409 });
    reservation = await reserveInstitution(institution.id, itemId);
    const institutionName = institution.name;

    const item: Item = {
      id: itemId,
      provider: "plaid",
      institutionName,
      institutionId: institution.id,
      accessTokenEnc: encrypt(accessToken),
      cursor: null,
      status: "healthy",
      error: null,
      lastSyncedAt: null,
      createdAt: new Date().toISOString(),
    };

    // Persist the connection right away in its own shard. Even if the first
    // sync returns nothing yet (Plaid generates history asynchronously), the
    // connection is saved and the webhook/cron will fill it in.
    writeMayHaveCommitted = true;
    try {
      await saveItemBundle({ item, accounts: [], transactions: [], recurring: [] });
    } catch (error) {
      if (error instanceof StorageConflictError) writeMayHaveCommitted = false;
      throw error;
    }
    unusedToken = null;
    let syncFailed = false;
    try {
      syncFailed = (await syncOneItem(item)).status !== "healthy";
    } catch {
      syncFailed = true;
    }
    const syncWarning = syncFailed
      ? "Connection saved. Initial bank sync needs attention. Check Settings and use Refresh; do not connect the bank again."
      : undefined;
    const snapshot = await refreshSnapshotAfterMutation();
    const warning = [syncWarning, snapshot.warning].filter(Boolean).join(" ");

    return NextResponse.json({ ok: true, institutionName, ...(warning ? { warning } : {}) });
  } catch (err) {
    const error = plaidErrorMessage(err) + (unusedToken && writeMayHaveCommitted
      ? " The connection may already be saved. Refresh Settings before trying again."
      : "");
    return NextResponse.json({ error }, { status: err instanceof StorageConflictError ? 409 : 500 });
  } finally {
    if (unusedToken && candidateItemId && !writeMayHaveCommitted) {
      let mayCleanup = false;
      try {
        // Never revoke a link saved by another request.
        mayCleanup = !(await loadItemBundle(candidateItemId));
      } catch {
        // Keep the claim when storage cannot prove that the item is absent.
      }
      if (mayCleanup) {
        try {
          await removePlaidItem(unusedToken);
        } catch {
          // A failed revoke must not hide the link rejection.
        }
        if (reservation) {
          try {
            await releaseInstitution(reservation);
          } catch {
            // Keep a failed claim closed; never delete a successor's claim.
          }
        }
      }
    }
  }
}
