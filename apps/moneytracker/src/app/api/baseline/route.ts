import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { storageConflictResponse } from "@/lib/api-response";
import { loadMeta, saveMeta } from "@/lib/store";
import { CATEGORIES } from "@/lib/categories";
import { RecurringBaseline } from "@/lib/types";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

async function saveBaseline(req: NextRequest, editing: boolean) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body))
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const amount = (typeof body.amount === "number" || typeof body.amount === "string" && body.amount.trim()) ? Number(body.amount) : NaN;
  const category = body.category == null ? "RENT_AND_UTILITIES" : typeof body.category === "string" ? body.category : "";
  const startMonth = typeof body.startMonth === "string" ? body.startMonth : "";
  const endMonth = body.endMonth == null || body.endMonth === "" ? null : body.endMonth;
  const id = typeof body.id === "string" ? body.id : "";
  if (!name || !Number.isFinite(amount) || amount <= 0 || !MONTH.test(startMonth) || !CATEGORIES[category]?.isSpending)
    return NextResponse.json({ error: "Name, positive amount, spending category, and start month (yyyy-mm) required" }, { status: 400 });
  if (endMonth !== null && (typeof endMonth !== "string" || !MONTH.test(endMonth) || endMonth < startMonth))
    return NextResponse.json({ error: "End month must be yyyy-mm and on or after start month" }, { status: 400 });
  if (editing && !id)
    return NextResponse.json({ error: "Missing baseline id" }, { status: 400 });

  const meta = await loadMeta();
  const baselines = meta.baselines ?? [];
  const index = baselines.findIndex((entry) => entry.id === id);
  if (editing && index < 0)
    return NextResponse.json({ error: "Baseline not found" }, { status: 404 });
  const duplicate = baselines.find((entry) =>
    (!editing || entry.id !== id) && entry.name.trim().toLowerCase() === name.toLowerCase() && entry.category === category && entry.startMonth === startMonth,
  );
  if (duplicate)
    return NextResponse.json({ error: `A "${duplicate.name}" baseline already exists from that month.` }, { status: 409 });
  const entry: RecurringBaseline = {
    ...(editing ? baselines[index] : {}),
    id: editing ? id : `base_${randomUUID()}`,
    name, amount, category, startMonth, endMonth,
  };
  meta.baselines = editing ? baselines.map((previous) => previous.id === id ? entry : previous) : [...baselines, entry];
  try { await saveMeta(meta); }
  catch (error) {
    return storageConflictResponse(error);
  }
  return NextResponse.json({ ok: true, entry });
}

export async function POST(req: NextRequest) { return saveBaseline(req, false); }
export async function PATCH(req: NextRequest) { return saveBaseline(req, true); }

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const meta = await loadMeta();
  meta.baselines = (meta.baselines ?? []).filter((entry) => entry.id !== id);
  try { await saveMeta(meta); }
  catch (error) {
    return storageConflictResponse(error);
  }
  return NextResponse.json({ ok: true });
}
