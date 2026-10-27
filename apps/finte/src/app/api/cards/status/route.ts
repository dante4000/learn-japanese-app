import { isAuthenticated } from "@/lib/auth";
import { storageConflictResponse } from "@/lib/api-response";
import { CARD_CATALOG } from "@/lib/cards";
import { loadMeta, saveMeta } from "@/lib/store";

export async function POST(request: Request) {
  if (!await isAuthenticated()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !CARD_CATALOG.some((card) => card.cardKey === body.cardKey) || !["active", "closed"].includes(body.status)) {
    return Response.json({ error: "Choose a valid card and status." }, { status: 400 });
  }
  const meta = await loadMeta();
  meta.cardStatuses = { ...meta.cardStatuses, [body.cardKey]: body.status };
  try { await saveMeta(meta); }
  catch (error) { return storageConflictResponse(error); }
  return Response.json({ ok: true });
}
