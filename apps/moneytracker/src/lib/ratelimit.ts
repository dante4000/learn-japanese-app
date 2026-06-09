// Lightweight in-memory sliding-window limiter for the login route. This blunts
// brute-force attempts against the single password. Note: serverless instances
// don't share memory, so this is best-effort defense-in-depth, not a hard cap —
// for a stricter guarantee, back it with Upstash Redis (see README).

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    const retryAfterMs = windowMs - (now - bucket.hits[0]);
    buckets.set(key, bucket);
    return { ok: false, retryAfterMs };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, retryAfterMs: 0 };
}
