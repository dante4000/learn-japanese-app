import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import {
  LalalConfigError,
  lalalMinutesLeft,
  lalalUpload,
} from "@/lib/stems/lalal";

export const runtime = "nodejs";
export const maxDuration = 120;

// Pulls the just-uploaded Blob, forwards its bytes to LALAL, then deletes the
// Blob. Returns the LALAL source id + duration + remaining account minutes.
export async function POST(request: Request): Promise<NextResponse> {
  let blobUrl: string | undefined;
  try {
    const body = (await request.json()) as {
      blobUrl?: string;
      filename?: string;
    };
    blobUrl = body.blobUrl;
    const filename = body.filename || "audio";
    if (!blobUrl || !/^https:\/\/[a-z0-9.-]+\.blob\.vercel-storage\.com\//i.test(blobUrl)) {
      return NextResponse.json({ error: "Missing audio." }, { status: 400 });
    }

    const minutesLeft = await lalalMinutesLeft();

    const res = await fetch(blobUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });
    }
    const bytes = await res.arrayBuffer();

    const uploaded = await lalalUpload(bytes, filename);

    return NextResponse.json({ ...uploaded, minutesLeft });
  } catch (e) {
    const status = e instanceof LalalConfigError ? 500 : 400;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed." },
      { status },
    );
  } finally {
    // Best-effort cleanup — LALAL has its own copy now.
    if (blobUrl) void del(blobUrl).catch(() => {});
  }
}
