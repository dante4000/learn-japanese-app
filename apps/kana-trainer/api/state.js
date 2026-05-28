// Per-user SRS state stored in a private Vercel Blob store.
// GET  /api/state?user=<name>   -> { user, state }   (state is null for a new user)
// POST /api/state  { user, state } -> { ok: true }
//
// Login is name-only: the username is slugified into a blob path users/<slug>.json.
// BLOB_READ_WRITE_TOKEN is provided automatically by the linked Blob store.
import { get, put } from '@vercel/blob';

const MAX_STATE_BYTES = 2 * 1024 * 1024; // 2 MB ceiling per user

function slug(name) {
  return String(name || '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]+/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  // Fallback: read the raw stream (covers runtimes that don't pre-parse)
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method === 'GET') {
      const user = slug(req.query && req.query.user);
      if (!user) return res.status(400).json({ error: 'missing or invalid user' });

      let result = null;
      try {
        result = await get(`users/${user}.json`, { access: 'private' });
      } catch (e) {
        // Treat "not found" as a brand-new user rather than an error.
        if (e && (e.name === 'BlobNotFoundError' || /not.?found/i.test(String(e.message)))) {
          return res.status(200).json({ user, state: null });
        }
        throw e;
      }

      if (!result || result.statusCode !== 200 || !result.stream) {
        return res.status(200).json({ user, state: null });
      }
      const text = await new Response(result.stream).text();
      let state = null;
      try { state = JSON.parse(text); } catch { state = null; }
      return res.status(200).json({ user, state });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const user = slug(body.user);
      if (!user) return res.status(400).json({ error: 'missing or invalid user' });

      const payload = JSON.stringify(body.state ?? {});
      if (Buffer.byteLength(payload, 'utf8') > MAX_STATE_BYTES) {
        return res.status(413).json({ error: 'state too large' });
      }

      await put(`users/${user}.json`, payload, {
        access: 'private',
        allowOverwrite: true,
        contentType: 'application/json',
        addRandomSuffix: false,
      });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
