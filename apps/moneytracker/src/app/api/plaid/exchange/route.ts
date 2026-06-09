import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { exchangePublicToken, getInstitutionName } from "@/lib/providers/plaid";
import { encrypt } from "@/lib/crypto";
import { mutateState } from "@/lib/store";
import { syncItem } from "@/lib/sync";
import { recordSnapshot } from "@/lib/analytics";
import { Item } from "@/lib/types";

// Completes the Plaid Link flow: exchange the public_token for a permanent
// access_token, persist it (encrypted), and run an initial historical sync.
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

    await mutateState(async (state) => {
      const existing = state.items.findIndex((i) => i.id === item.id);
      if (existing === -1) state.items.push(item);
      else state.items[existing] = item;
      await syncItem(state, item);
      recordSnapshot(state, new Date().toISOString().slice(0, 10));
    });

    return NextResponse.json({ ok: true, institutionName });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Exchange failed" },
      { status: 500 },
    );
  }
}
