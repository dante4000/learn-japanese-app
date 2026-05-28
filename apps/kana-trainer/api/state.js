// Per-user SRS state stored in a private Vercel Blob store.
// GET    /api/state?user=<name>&pin=<pin>  -> { user, state }   (state null if new user)
// POST   /api/state  { user, pin, state }  -> { ok: true }      (creates user on first call)
// DELETE /api/state?user=<name>&pin=<pin>  -> { ok: true }
//
// Auth model: the user picks a PIN on first POST. Server stores a salted SHA-256
// hash next to the state. Subsequent GETs/POSTs/DELETEs require the PIN.
// Legacy blobs (raw state, no pinHash) can be read with any PIN and are
// "claimed" by the first POST that includes one.
import { get, put, del } from '@vercel/blob';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const MAX_STATE_BYTES = 2 * 1024 * 1024; // 2 MB ceiling per user
const PIN_MIN = 4;
const PIN_MAX = 32;

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

function validPin(pin) {
  return typeof pin === 'string' && pin.length >= PIN_MIN && pin.length <= PIN_MAX;
}

function hashPin(pin, salt) {
  return createHash('sha256').update(salt + ':' + pin, 'utf8').digest('hex');
}

function pinMatches(pin, salt, expectedHash) {
  const got = Buffer.from(hashPin(pin, salt), 'hex');
  const exp = Buffer.from(expectedHash, 'hex');
  if (got.length !== exp.length) return false;
  return timingSafeEqual(got, exp);
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

// Returns { record, legacy } where record is the parsed blob (or null on new
// user) and legacy=true means the stored shape is raw state with no pinHash.
async function fetchRecord(user) {
  let result = null;
  try {
    result = await get(`users/${user}.json`, { access: 'private' });
  } catch (e) {
    if (e && (e.name === 'BlobNotFoundError' || /not.?found/i.test(String(e.message)))) {
      return { record: null, legacy: false };
    }
    throw e;
  }
  if (!result || result.statusCode !== 200 || !result.stream) {
    return { record: null, legacy: false };
  }
  const text = await new Response(result.stream).text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { return { record: null, legacy: false }; }
  if (parsed && typeof parsed === 'object' && typeof parsed.pinHash === 'string' && typeof parsed.salt === 'string') {
    return { record: parsed, legacy: false };
  }
  // Legacy: raw state object with no auth fields.
  return { record: { state: parsed }, legacy: true };
}

async function writeRecord(user, record) {
  const payload = JSON.stringify(record);
  if (Buffer.byteLength(payload, 'utf8') > MAX_STATE_BYTES) {
    const err = new Error('state too large');
    err.code = 413;
    throw err;
  }
  await put(`users/${user}.json`, payload, {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
    addRandomSuffix: false,
  });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method === 'GET') {
      const user = slug(req.query && req.query.user);
      const pin = String((req.query && req.query.pin) || '');
      if (!user) return res.status(400).json({ error: 'missing or invalid user' });

      const { record, legacy } = await fetchRecord(user);
      if (!record) return res.status(200).json({ user, state: null, legacy: false });
      if (legacy) {
        // No PIN set yet — return state (no auth required). Next POST will claim.
        return res.status(200).json({ user, state: record.state ?? null, legacy: true });
      }
      if (!validPin(pin) || !pinMatches(pin, record.salt, record.pinHash)) {
        return res.status(401).json({ error: 'invalid pin' });
      }
      return res.status(200).json({ user, state: record.state ?? null, legacy: false });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const user = slug(body.user);
      const pin = String(body.pin || '');
      if (!user) return res.status(400).json({ error: 'missing or invalid user' });
      if (!validPin(pin)) return res.status(400).json({ error: `pin must be ${PIN_MIN}-${PIN_MAX} chars` });

      const { record, legacy } = await fetchRecord(user);
      let salt, pinHash;
      if (!record || legacy) {
        // New user, or legacy blob being claimed.
        salt = randomBytes(16).toString('hex');
        pinHash = hashPin(pin, salt);
      } else {
        if (!pinMatches(pin, record.salt, record.pinHash)) {
          return res.status(401).json({ error: 'invalid pin' });
        }
        salt = record.salt;
        pinHash = record.pinHash;
      }

      const next = { v: 1, salt, pinHash, state: body.state ?? null, updatedAt: Date.now() };
      try { await writeRecord(user, next); }
      catch (e) { if (e.code === 413) return res.status(413).json({ error: 'state too large' }); throw e; }
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const user = slug(req.query && req.query.user);
      const pin = String((req.query && req.query.pin) || '');
      if (!user) return res.status(400).json({ error: 'missing or invalid user' });

      const { record, legacy } = await fetchRecord(user);
      if (!record) return res.status(200).json({ ok: true }); // already gone
      if (!legacy && (!validPin(pin) || !pinMatches(pin, record.salt, record.pinHash))) {
        return res.status(401).json({ error: 'invalid pin' });
      }
      try { await del(`users/${user}.json`); } catch { /* best-effort */ }
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
