import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { loadMeta, saveMeta } from "@/lib/store";
import { storageConflictResponse } from "@/lib/api-response";
import { PLAN_KINDS, PlanError, savePlan, saveBudgetPreference, type PlanKind } from "@/lib/planning";

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || !PLAN_KINDS.includes(body.kind) || !["save", "save-many", "delete"].includes(body.action)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const kind = body.kind as PlanKind;
  try {
    const meta = await loadMeta();
    if (body.action === "save-many") {
      if (kind !== "budgets" || !Array.isArray(body.records) || !body.records.length || body.records.length > 20) throw new PlanError("Invalid budget preset.");
      const ids = new Set(body.records.map((r: { id?: string }) => r?.id));
      if (ids.size !== body.records.length) throw new PlanError("Duplicate budget records.");
      const preference = body.preference ? saveBudgetPreference(meta, body.preference) : undefined;
      for (const record of body.records) savePlan(meta, "budgets", record);
      await saveMeta(meta);
      return NextResponse.json({ ok: true, records: meta.budgets, preference });
    }
    if (body.action === "delete") {
      if (typeof body.id !== "string" || !Number.isSafeInteger(body.revision)) throw new PlanError("Invalid record.");
      const existing = meta[kind]?.find((r) => r.id === body.id);
      if (existing && existing.revision !== body.revision) throw new PlanError("This plan changed. Reload the page before deleting it.", 409);
      Object.assign(meta, { [kind]: (meta[kind] ?? []).filter((r) => r.id !== body.id) });
      await saveMeta(meta);
      return NextResponse.json({ ok: true });
    }
    const record = savePlan(meta, kind, body.record);
    await saveMeta(meta);
    return NextResponse.json({ ok: true, record });
  } catch (error) {
    if (error instanceof PlanError) return NextResponse.json({ error: error.message }, { status: error.status });
    return storageConflictResponse(error);
  }
}
