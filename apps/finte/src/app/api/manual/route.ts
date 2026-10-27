import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { storageConflictResponse } from "@/lib/api-response";
import { loadMeta, saveMeta } from "@/lib/store";
import { refreshSnapshotAfterMutation } from "@/lib/sync";
import { ManualEntry } from "@/lib/types";

// Manual assets/liabilities (home value, car, cash, etc.) so net worth is
// complete even for things no bank reports. Stored in the global meta document.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const value = Number(body.value);
  const kind = body.kind === "liability" ? "liability" : "asset";
  if (!name || body.value == null || (typeof body.value === "string" && !body.value.trim()) || !["string", "number"].includes(typeof body.value) || !Number.isFinite(value) || !["asset", "liability"].includes(body.kind))
    return NextResponse.json({ error: "Name and numeric value required" }, { status: 400 });

  if (body.requestId != null && (typeof body.requestId !== "string" || !/^[\w-]{1,80}$/.test(body.requestId))) return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  if (body.currency != null && (typeof body.currency !== "string" || !/^[A-Z]{3}$/.test(body.currency))) return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
  const entry: ManualEntry = {
    id: "manual_" + (body.requestId || crypto.randomUUID()),
    currency: body.currency || "USD",
    name,
    kind,
    value: Math.abs(value),
    asOf: new Date().toISOString().slice(0, 10),
  };

  const meta = await loadMeta();
  const existing = meta.manualEntries.find((saved) => saved.id === entry.id);
  if (existing) return NextResponse.json({ ok: true, entry: existing });
  meta.manualEntries.push(entry);
  try {
    await saveMeta(meta);
  } catch (error) {
    return storageConflictResponse(error);
  }
  const snapshot = await refreshSnapshotAfterMutation();
  return NextResponse.json({ ok: true, entry, ...snapshot });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const meta = await loadMeta();
  meta.manualEntries = meta.manualEntries.filter((m) => m.id !== id);
  try {
    await saveMeta(meta);
  } catch (error) {
    return storageConflictResponse(error);
  }
  const snapshot = await refreshSnapshotAfterMutation();
  return NextResponse.json({ ok: true, ...snapshot });
}
