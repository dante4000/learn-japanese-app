import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { loadMeta, saveMeta } from "@/lib/store";
import { RecurringBaseline } from "@/lib/types";

// Recurring baselines — fixed monthly expenses (e.g. rent + parking) the bank
// feed doesn't reliably capture. Stored in the global meta document.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const name = (body.name as string)?.trim();
  const amount = Number(body.amount);
  const category = (body.category as string) || "RENT_AND_UTILITIES";
  const startMonth = (body.startMonth as string) || "";
  if (!name || !isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}$/.test(startMonth))
    return NextResponse.json(
      { error: "Name, positive amount, and startMonth (yyyy-mm) required" },
      { status: 400 },
    );

  const entry: RecurringBaseline = {
    id: "base_" + Date.now().toString(36),
    name,
    amount,
    category,
    startMonth,
  };

  const meta = await loadMeta();
  // A double-submit used to append a second identical baseline, and each one
  // injects its own synthetic "(estimated)" row every month — silently counting
  // the expense twice in every total. Same name + category + start = duplicate.
  const existing = (meta.baselines ?? []).find(
    (b) =>
      b.name.trim().toLowerCase() === name.toLowerCase() &&
      b.category === category &&
      b.startMonth === startMonth,
  );
  if (existing)
    return NextResponse.json(
      { error: `A "${existing.name}" baseline already exists from that month.` },
      { status: 409 },
    );

  meta.baselines = [...(meta.baselines ?? []), entry];
  await saveMeta(meta);
  return NextResponse.json({ ok: true, entry });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const meta = await loadMeta();
  meta.baselines = (meta.baselines ?? []).filter((b) => b.id !== id);
  await saveMeta(meta);
  return NextResponse.json({ ok: true });
}
