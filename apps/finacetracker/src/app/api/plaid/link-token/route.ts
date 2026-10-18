import { loadItemBundle } from "@/lib/store";
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  createLinkToken,
  plaidConfigured,
  plaidErrorMessage,
} from "@/lib/providers/plaid";

export async function POST(request: Request) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!plaidConfigured())
    return NextResponse.json(
      { error: "Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET." },
      { status: 503 },
    );
  try {
    const body = await request.text();
    let itemId: unknown;
    try { itemId = body ? JSON.parse(body)?.itemId : undefined; } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
    if (itemId !== undefined && (typeof itemId !== "string" || !/^[\w-]{1,200}$/.test(itemId))) return NextResponse.json({ error: "Invalid connection" }, { status: 400 });
    const bundle = typeof itemId === "string" ? await loadItemBundle(itemId) : null;
    if (itemId && (!bundle || bundle.item.provider !== "plaid")) return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    const link_token = await createLinkToken(bundle?.item);
    return NextResponse.json({ link_token });
  } catch (err) {
    return NextResponse.json({ error: plaidErrorMessage(err) }, { status: 500 });
  }
}
