import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { mutateState } from "@/lib/store";
import { recordSnapshot } from "@/lib/analytics";
import { ManualEntry } from "@/lib/types";

// Manual assets/liabilities (home value, car, cash, etc.) so net worth is
// complete even for things no bank reports.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const name = (body.name as string)?.trim();
  const value = Number(body.value);
  const kind = body.kind === "liability" ? "liability" : "asset";
  if (!name || isNaN(value))
    return NextResponse.json({ error: "Name and numeric value required" }, { status: 400 });

  const entry: ManualEntry = {
    id: "manual_" + Date.now().toString(36),
    name,
    kind,
    value: Math.abs(value),
    asOf: new Date().toISOString().slice(0, 10),
  };

  await mutateState((state) => {
    state.manualEntries.push(entry);
    recordSnapshot(state, new Date().toISOString().slice(0, 10));
  });
  return NextResponse.json({ ok: true, entry });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await mutateState((state) => {
    state.manualEntries = state.manualEntries.filter((m) => m.id !== id);
    recordSnapshot(state, new Date().toISOString().slice(0, 10));
  });
  return NextResponse.json({ ok: true });
}
