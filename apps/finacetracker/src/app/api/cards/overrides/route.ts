import { isAuthenticated } from "@/lib/auth";
import { storageConflictResponse } from "@/lib/api-response";
import { mergeCardOverrides, validCreditSlot, validateCardOverrides } from "@/lib/card-overrides";
import { loadMeta, saveMeta } from "@/lib/store";

export async function POST(request: Request) {
  if (!await isAuthenticated()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  let incoming;
  try { incoming = validateCardOverrides(body?.overrides); }
  catch (error) { return Response.json({ error: (error as Error).message }, { status: 400 }); }
  const meta = await loadMeta();
  meta.cardOverrides = mergeCardOverrides(meta.cardOverrides ?? {}, incoming);
  try { await saveMeta(meta); } catch (error) { return storageConflictResponse(error); }
  return Response.json({ overrides: meta.cardOverrides });
}

export async function PATCH(request: Request) {
  if (!await isAuthenticated()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !validCreditSlot(body.cardKey, body.creditName, body.slotKey) || body.value !== null && typeof body.value !== "boolean") return Response.json({ error: "Choose a valid credit period and correction." }, { status: 400 });
  const meta = await loadMeta();
  const overrides = meta.cardOverrides ??= {};
  const credit = (overrides[body.cardKey] ??= {})[body.creditName] ??= {};
  if (body.value === null) delete credit[body.slotKey];
  else credit[body.slotKey] = body.value;
  try { await saveMeta(meta); } catch (error) { return storageConflictResponse(error); }
  return Response.json({ overrides });
}
