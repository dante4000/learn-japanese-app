import { CATEGORIES } from "@/lib/categories";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { storageConflictResponse } from "@/lib/api-response";
import { listItemIds, loadItemBundle, saveItemBundle } from "@/lib/store";

// Apply user overrides to a transaction (recategorize, hide from analytics, or
// add a note). These survive re-syncs. Updates only the owning item's bundle.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (body.userCategory != null && (typeof body.userCategory !== "string" || !CATEGORIES[body.userCategory]))
    return NextResponse.json({ error: "Unknown category" }, { status: 400 });
  if (typeof body.note === "string" && body.note.length > 2000)
    return NextResponse.json({ error: "Note is too long" }, { status: 400 });
  const ids = await listItemIds();
  for (const itemId of ids) {
    const bundle = await loadItemBundle(itemId);
    const t = bundle?.transactions.find((x) => x.id === id);
    if (bundle && t) {
      if (typeof body.userCategory === "string" || body.userCategory === null)
        t.userCategory = (body.userCategory as string) || null;
      if (typeof body.hidden === "boolean") t.hidden = body.hidden;
      if (typeof body.note === "string" || body.note === null)
        t.note = (body.note as string) || null;
      try {
        await saveItemBundle(bundle);
      } catch (error) {
        return storageConflictResponse(error);
      }
      return NextResponse.json({ ok: true });
    }
  }
  return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
}
