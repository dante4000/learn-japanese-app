// Per-user SRS state stored in a private Vercel Blob store. Name-only (no auth):
// the username is slugified into a blob path users/<slug>.json.
// GET    /api/state?user=<name>     -> { user, state }   (state null if new user)
// POST   /api/state  { user, state } -> { ok: true }
// DELETE /api/state?user=<name>     -> { ok: true }
import { get, put, del } from '@vercel/blob';

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
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return {}; }
}

async function readState(user) {
  let result = null;
  try {
    result = await get(`users/${user}.json`, { access: 'private' });
  } catch (e) {
    if (e && (e.name === 'BlobNotFoundError' || /not.?found/i.test(String(e.message)))) return null;
    throw e;
  }
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  try { return JSON.parse(text); } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method === 'GET') {
      const user = slug(req.query && req.query.user);
      if (!user) return res.status(400).json({ error: 'missing or invalid user' });
      const state = await readState(user);
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

    if (req.method === 'DELETE') {
      const user = slug(req.query && req.query.user);
      if (!user) return res.status(400).json({ error: 'missing or invalid user' });
      try { await del(`users/${user}.json`); } catch { /* best-effort */ }
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
