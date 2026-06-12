import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { syncAll } from "@/lib/sync";

// Manual "refresh now" trigger from the UI.
export async function POST() {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await syncAll();
    return NextResponse.json({
      ok: true,
      synced: result.items,
      errors: result.errors,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
