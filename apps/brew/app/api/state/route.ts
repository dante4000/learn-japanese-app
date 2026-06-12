import { list, put } from "@vercel/blob";

// One small JSON blob holds every recipe's saved rice/nuruk values.
// Single-user personal tool — no auth, public blob, stable pathname.
const PATHNAME = "brew/scaler-state.json";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { blobs } = await list({ prefix: PATHNAME, limit: 1 });
    const found = blobs.find((b) => b.pathname === PATHNAME);
    if (!found) return Response.json({});
    const res = await fetch(found.url, { cache: "no-store" });
    if (!res.ok) return Response.json({});
    const data = await res.json();
    return Response.json(data ?? {});
  } catch {
    // No blob store / token (e.g. local dev) — client falls back to localStorage.
    return Response.json({});
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await put(PATHNAME, JSON.stringify(body), {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
      addRandomSuffix: false,
      cacheControlMaxAge: 0,
    });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "failed" },
      { status: 200 },
    );
  }
}
