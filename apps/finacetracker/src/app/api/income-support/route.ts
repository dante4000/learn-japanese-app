import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { storageConflictResponse } from "@/lib/api-response";
import { loadMeta, saveMeta } from "@/lib/store";
import { parseEmployerHousingSupport } from "@/lib/income-support";

/** Persist documented employer-paid studio support, separate from bank income. */
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const support = parseEmployerHousingSupport(await req.json().catch(() => null));
  if (!support) return NextResponse.json({ error: "Source, positive amount, and valid start/end months required" }, { status: 400 });
  const meta = await loadMeta();
  meta.employerHousingSupport = support;
  try { await saveMeta(meta); }
  catch (error) {
    return storageConflictResponse(error);
  }
  return NextResponse.json({ ok: true, support });
}

export async function DELETE() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const meta = await loadMeta();
  meta.employerHousingSupport = null;
  try { await saveMeta(meta); }
  catch (error) {
    return storageConflictResponse(error);
  }
  return NextResponse.json({ ok: true });
}
