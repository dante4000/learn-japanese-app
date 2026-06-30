import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { loadMeta, saveMeta } from "@/lib/store";
import { BiltConfig } from "@/lib/types";

// Bilt rent-meter settings: the editable housing payment (override of the rent
// baseline) and the statement-cycle start day. Stored in the global meta doc.
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const statementDay = Number(body.statementDay);
  if (!Number.isInteger(statementDay) || statementDay < 1 || statementDay > 28)
    return NextResponse.json(
      { error: "statementDay must be an integer 1–28" },
      { status: 400 },
    );

  const config: BiltConfig = { statementDay };

  if (body.housingOverride != null && body.housingOverride !== "") {
    const amount = Number(body.housingOverride);
    if (!isFinite(amount) || amount <= 0)
      return NextResponse.json(
        { error: "housingOverride must be a positive number" },
        { status: 400 },
      );
    config.housingOverride = amount;
  }

  const meta = await loadMeta();
  meta.biltConfig = config;
  await saveMeta(meta);
  return NextResponse.json({ ok: true, config });
}
