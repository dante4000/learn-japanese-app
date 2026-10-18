import { isAuthenticated } from "@/lib/auth";
import { loadItemBundle } from "@/lib/store";
import { syncOneItem, refreshSnapshotAfterMutation } from "@/lib/sync";

export async function POST(request: Request) {
  if (!await isAuthenticated()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.itemId !== "string" || !/^[\w-]{1,200}$/.test(body.itemId)) return Response.json({ error: "Invalid connection" }, { status: 400 });
  const bundle = await loadItemBundle(body.itemId);
  if (!bundle || bundle.item.provider !== "plaid") return Response.json({ error: "Connection not found" }, { status: 404 });
  const result = await syncOneItem(bundle.item);
  if (result.status !== "healthy") return Response.json({ error: result.error || "The existing connection still needs attention. Its history is preserved." }, { status: 502 });
  const snapshot = await refreshSnapshotAfterMutation();
  return Response.json({ institutionName: bundle.item.institutionName, warning: [result.warning, snapshot.warning].filter(Boolean).join(" ") || undefined });
}
