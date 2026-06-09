import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { mutateState } from "@/lib/store";

// Apply user overrides to a transaction (recategorize, hide from analytics, or
// add a note). These survive re-syncs.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const id = body.id as string;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await mutateState((state) => {
    const t = state.transactions.find((x) => x.id === id);
    if (!t) throw new Error("Transaction not found");
    if (typeof body.userCategory === "string" || body.userCategory === null)
      t.userCategory = (body.userCategory as string) || null;
    if (typeof body.hidden === "boolean") t.hidden = body.hidden;
    if (typeof body.note === "string" || body.note === null)
      t.note = (body.note as string) || null;
  });

  return NextResponse.json({ ok: true });
}
