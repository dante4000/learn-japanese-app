import { NextRequest, NextResponse } from "next/server";
import { mutateState } from "@/lib/store";
import { syncAll } from "@/lib/sync";

// Daily reconciliation sync, invoked by Vercel Cron (see vercel.json). Catches
// any webhook we missed. Protected by CRON_SECRET, which Vercel sends as a
// Bearer token.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const state = await mutateState((s) => syncAll(s));
    return NextResponse.json({ ok: true, items: state.items.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
