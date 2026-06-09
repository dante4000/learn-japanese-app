import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createLinkToken, plaidConfigured } from "@/lib/providers/plaid";

export async function POST() {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!plaidConfigured())
    return NextResponse.json(
      { error: "Plaid is not configured. Set PLAID_CLIENT_ID and PLAID_SECRET." },
      { status: 503 },
    );
  try {
    const link_token = await createLinkToken();
    return NextResponse.json({ link_token });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create link token" },
      { status: 500 },
    );
  }
}
