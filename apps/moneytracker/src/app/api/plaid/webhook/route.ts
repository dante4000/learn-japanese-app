import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { importJWK, jwtVerify, decodeProtectedHeader, type JWK } from "jose";
import { plaidClient, plaidConfigured } from "@/lib/providers/plaid";
import { loadState } from "@/lib/store";
import { syncOneItem, updateSnapshot } from "@/lib/sync";

// Plaid webhook receiver. The webhook is just a SIGNAL — when it fires we run
// /transactions/sync ourselves. We verify Plaid's JWT signature (and that the
// body hash matches the signed claim) before acting, so the endpoint can't be
// spoofed or replayed against us.

const keyCache = new Map<string, JWK>();

async function getVerificationKey(kid: string): Promise<JWK> {
  if (keyCache.has(kid)) return keyCache.get(kid)!;
  const res = await plaidClient().webhookVerificationKeyGet({ key_id: kid });
  const jwk = res.data.key as unknown as JWK;
  keyCache.set(kid, jwk);
  return jwk;
}

async function verify(req: NextRequest, rawBody: string): Promise<boolean> {
  const token = req.headers.get("plaid-verification");
  if (!token) return false;
  try {
    const { kid, alg } = decodeProtectedHeader(token);
    if (alg !== "ES256" || !kid) return false;
    const jwk = await getVerificationKey(kid);
    const key = await importJWK(jwk, "ES256");
    const { payload } = await jwtVerify(token, key, {
      maxTokenAge: "5 min",
    });
    const expected = (payload as { request_body_sha256?: string })
      .request_body_sha256;
    const actual = createHash("sha256").update(rawBody).digest("hex");
    return !!expected && expected === actual;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!plaidConfigured())
    return NextResponse.json({ error: "not configured" }, { status: 503 });

  const rawBody = await req.text();
  if (!(await verify(req, rawBody))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as {
    webhook_type?: string;
    webhook_code?: string;
    item_id?: string;
  };

  // We only need to act on transaction updates; ignore the rest (ack 200).
  if (body.webhook_type === "TRANSACTIONS" && body.item_id) {
    const state = await loadState();
    const item = state.items.find((i) => i.id === body.item_id);
    if (item) {
      await syncOneItem(item);
      await updateSnapshot();
    }
  }

  return NextResponse.json({ ok: true });
}
