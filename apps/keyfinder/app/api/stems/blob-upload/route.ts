import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Issues short-lived client tokens so the browser uploads the audio file
// directly to Vercel Blob, bypassing the 4.5 MB Vercel Function body limit.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "audio/mpeg",
          "audio/mp3",
          "audio/wav",
          "audio/x-wav",
          "audio/mp4",
          "audio/x-m4a",
          "audio/aac",
          "audio/ogg",
          "audio/flac",
          "audio/*",
        ],
        addRandomSuffix: true,
        // Blobs are transient — the server deletes them right after LALAL ingests.
        validUntil: Date.now() + 60 * 60 * 1000,
      }),
      // No-op: we ingest into LALAL explicitly from /api/stems/upload, so we
      // don't depend on this webhook (which never fires on localhost anyway).
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload authorization failed." },
      { status: 400 },
    );
  }
}
