import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  exchangePublicToken,
  getInstitutionName,
  plaidErrorMessage,
} from "@/lib/providers/plaid";
import { encrypt } from "@/lib/crypto";
import { saveItemBundle } from "@/lib/store";
import { syncOneItem, updateSnapshot } from "@/lib/sync";
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
    publicToken = body?.public_token ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!publicToken)
    return NextResponse.json({ error: "Missing public_token" }, { status: 400 });

  try {
    const { accessToken, itemId } = await exchangePublicToken(publicToken);
    const institutionName = await getInstitutionName(accessToken);

    const item: Item = {
      id: itemId,
      provider: "plaid",
      institutionName,
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
    await saveItemBundle({ item, accounts: [], transactions: [], recurring: [] });
    await syncOneItem(item);
    await updateSnapshot();

    return NextResponse.json({ ok: true, institutionName });
  } catch (err) {
    return NextResponse.json({ error: plaidErrorMessage(err) }, { status: 500 });
  }
}
