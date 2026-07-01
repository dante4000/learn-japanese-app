export const runtime = "nodejs";

const ALLOWED_HOST = "d.lalal.ai";

// LALAL returns each stem in the source format; pick the right extension from
// the actual content-type so downloads aren't mislabeled.
const EXT_BY_TYPE: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/ogg": "ogg",
};

// Same-origin streaming proxy for LALAL stem downloads. Host-allowlisted to
// d.lalal.ai (SSRF guard). Used both for in-browser decode and downloads.
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");
  const download = searchParams.get("download") === "1";
  const name = searchParams.get("name");

  if (!target) return new Response("Missing url", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response("Bad url", { status: 400 });
  }
  if (parsed.hostname !== ALLOWED_HOST) {
    return new Response("Forbidden host", { status: 400 });
  }

  const upstream = await fetch(parsed.toString());
  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream error", { status: 502 });
  }

  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);
  headers.set("Cache-Control", "private, max-age=3600");
  if (download) {
    const base = (name || "stem").replace(/[^\w.-]+/g, "_").replace(/\.[^.]+$/, "");
    const ext = EXT_BY_TYPE[contentType.split(";")[0].trim().toLowerCase()] || "audio";
    headers.set("Content-Disposition", `attachment; filename="${base}.${ext}"`);
  }

  return new Response(upstream.body, { status: 200, headers });
}
