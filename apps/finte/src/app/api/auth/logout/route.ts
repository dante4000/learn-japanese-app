import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  session.destroy();
  (await getSession(true)).destroy();
  return NextResponse.json({ ok: true });
}
