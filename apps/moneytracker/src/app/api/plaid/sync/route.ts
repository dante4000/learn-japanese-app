import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { mutateState } from "@/lib/store";
import { syncAll } from "@/lib/sync";

// Manual "refresh now" trigger from the UI.
export async function POST() {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const state = await mutateState((s) => syncAll(s));
    const errored = state.items.filter((i) => i.status === "error");
    return NextResponse.json({
      ok: true,
      synced: state.items.length,
      errors: errored.map((i) => ({ institution: i.institutionName, error: i.error })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
