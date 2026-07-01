import { NextResponse } from "next/server";
import {
  LalalConfigError,
  lalalCheckRaw,
  normalizeCheck,
} from "@/lib/stems/lalal";

export const runtime = "nodejs";

// Rewrite a LALAL d.lalal.ai download URL to our same-origin audio proxy so the
// browser can fetch + decodeAudioData without CORS issues.
function proxyUrl(url: string): string {
  return `/api/stems/audio?url=${encodeURIComponent(url)}`;
}

// Polls a split task and returns a normalized status the client can render.
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { task_ids } = (await request.json()) as { task_ids?: string[] };
    if (!Array.isArray(task_ids) || task_ids.length === 0) {
      return NextResponse.json({ error: "Missing task." }, { status: 400 });
    }
    const raw = await lalalCheckRaw(task_ids);
    const normalized = normalizeCheck(raw, task_ids[0], proxyUrl);
    return NextResponse.json(normalized);
  } catch (e) {
    const status = e instanceof LalalConfigError ? 500 : 400;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not check status." },
      { status },
    );
  }
}
