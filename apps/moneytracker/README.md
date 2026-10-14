# Vault — personal money tracker

A single-user, Rocket Money–style dashboard: connect your banks (Chase, Amex,
and 12,000+ institutions via **Plaid**), or import CSV exports, and see net
worth, spending by category, monthly cash flow, top merchants, and recurring
subscriptions — all behind one password, with everything encrypted at rest.

Built with Next.js 16 (App Router) + React 19 + Tailwind 4, deployed on Vercel.

---

## What you get

- **Overview** — net worth (assets − liabilities) with a trend line, this
  month's spending/income/net, spending donut, 6-month cash-flow bars, top
  merchants, recent activity.
- **Activity** — searchable, filterable transaction feed; recategorize or hide
  any transaction (your edits survive re-syncs).
- **Accounts** — balances grouped into assets vs liabilities; add manual
  assets/liabilities (home, car, cash) for a complete net worth.
- **Recurring** — auto-detected subscriptions/bills + income streams with
  monthly/annual totals and predicted next charge (Plaid only).
- **Settings** — connect banks via Plaid, import CSVs, manage/remove
  connections, security overview.

---

## The backends you need

| Need | Service | Why | Cost |
|---|---|---|---|
| **Bank data** | **Plaid** | Pulls balances + transactions from Chase, Amex, etc. (read-only) | Free trial (10 items); pay-as-you-go after. Production needs an application. |
| **Storage** | **Vercel Blob** | Holds encrypted connection documents and global metadata | Free tier is ample for one user |
| **Hosting** | **Vercel** | Next.js host + daily cron sync | Hobby plan works |

No separate database is required. Each connection has an AES-256-GCM encrypted
Blob document. A separate metadata document holds manual entries, baselines,
and snapshots. Conditional writes reject stale updates across server instances.
Reload and retry when another request changed the same document. Local storage
uses a file lock and atomic replacement. It recovers locks owned by a dead
process on the same host. For an unreadable lock or interrupted lock recovery,
stop local app processes before removing the remaining `.enc.lock` or
`.enc.lock.recover` file.
Updates to separate documents are not one transaction. CSV import works with **zero** external services beyond hosting + storage,
so you have a fully working app even before Plaid Production is approved.

Public Blob changes can take up to 60 seconds to appear after a successful save.
The app uses the minimum supported cache duration. Query parameters bypass
browser caches but do not remove the Blob cache delay. Wait one minute, then
refresh before submitting the same change again. Conditional writes still reject
stale updates because each read retains the ETag from its own document response.
See [Vercel Blob caching](https://vercel.com/docs/vercel-blob#caching).

Dashboard pages share one fresh Blob listing per request. Unchanged encrypted
documents can reuse a process cache after their ETags match that listing. The
cache holds at most 16 documents and 16 MiB. Each read decodes fresh objects.
API and sync reads still fetch document bodies. This adds no cache time window.

Navigation and server filters show immediate status. A dismissible loading
dialog appears after 450 ms. Fast actions avoid the modal. Query and account
filters share a pending transition to prevent overlapping choices from losing
URL parameters. Scheduled background refreshes do not open the dialog.

The storage regression test uses three connections and metadata. With simulated
25 ms network latency, reads fell from 9 requests to 5 cold or 1 warm. These are
controlled test counts, not a production latency guarantee.

Institution claims prevent concurrent connections to the same bank. A request
that stops before saving its connection can leave a claim. Claims do not expire:
an expired claim could let a delayed request create a duplicate connection.
Confirm that the request has stopped before removing an orphan claim.

---

## Environment variables

See `.env.example`. Generate the secrets:

```bash
# session cookie secret
openssl rand -base64 48
# token/data encryption key (32 bytes hex)
openssl rand -hex 32
# cron secret
openssl rand -hex 16
# password hash (replace YOUR_PASSWORD)
node -e "console.log(require('crypto').createHash('sha256').update('YOUR_PASSWORD').digest('hex'))"
```

| Var | Purpose |
|---|---|
| `SESSION_SECRET` | Encrypts/signs the login session cookie (≥32 chars) |
| `APP_PASSWORD_HASH` | SHA-256 hash of your login password |
| `ENCRYPTION_KEY` | 32-byte hex key; encrypts all data at rest |
| `PLAID_CLIENT_ID` / `PLAID_SECRET` | Plaid API keys |
| `PLAID_ENV` | `sandbox` to start, `production` once approved |
| `APP_BASE_URL` | Public URL (e.g. `https://moneytracker.vercel.app`) — enables Plaid OAuth + webhooks |
| `BLOB_READ_WRITE_TOKEN` | Auto-injected by Vercel when you add a Blob store |
| `CRON_SECRET` | Protects the daily cron sync endpoint |

---

## Local development

```bash
npm install
# create .env.local with at least SESSION_SECRET, APP_PASSWORD_HASH, ENCRYPTION_KEY
npm run dev
```

Without a Blob token, state persists to local documents in `.data/v2/` so you can
develop and test offline. Local documents are encrypted when `ENCRYPTION_KEY` is set.
Without this key, local development stores plaintext. Blob storage requires the key. CSV import works immediately; Plaid needs keys.

---

## Deploying to Vercel

1. **Create the project** — import this directory as a new Vercel project (root
   = `apps/moneytracker`), or `vercel` from this folder.
2. **Add a Blob store** — Storage → Create → Blob. This injects
   `BLOB_READ_WRITE_TOKEN` automatically.
3. **Set env vars** — add every variable above in Project → Settings →
   Environment Variables (Production). Set `APP_BASE_URL` to your deployment URL.
4. **Deploy.** The `vercel.json` cron runs `/api/cron/sync` daily.

### How this project deploys

Pushing to `main` on `dante4000/learn-japanese-app` (the monorepo this app
lives in) deploys production. The Vercel project's Root Directory is
`apps/moneytracker`, and its Ignored Build Step is
`git diff --quiet HEAD^ HEAD -- .`, so pushes that don't touch this app are
skipped — the repo hosts several projects.

`vercel --prod` no longer works for this project, from either directory.
From here the CLI looks for `apps/moneytracker/apps/moneytracker` (it resolves
the Root Directory beneath whatever it uploads); from the repo root it would
deploy the **`sites`** project, which is what that directory is linked to.
To ship without a commit, use
`vercel redeploy <deployment-url> --target production --scope dante4000`
(the scope flag is required — resolving a deployment by URL doesn't pick up
the linked team), or the Redeploy button in the dashboard.

### Plaid setup

1. Create a Plaid account → Team Settings → Keys for `PLAID_CLIENT_ID` /
   `PLAID_SECRET`. Start in **sandbox**.
2. Add `https://YOUR_DOMAIN/oauth` to **API → Allowed redirect URIs** (required
   for OAuth banks like Chase).
3. Point the Transactions webhook at `https://YOUR_DOMAIN/api/plaid/webhook`
   (the app also sets this per-Item automatically when `APP_BASE_URL` is set).
4. Apply for **Production** access when ready, then set `PLAID_ENV=production`.

---

## Security model

- Single-user; login is a hashed password compared in constant time, with
  per-IP login rate-limiting.
- Session cookie is HTTP-only, signed/encrypted (iron-session), SameSite-lax,
  Secure in production.
- **All persisted data is AES-256-GCM encrypted** — storage holds only
  ciphertext. Plaid access tokens are additionally encrypted and never sent to
  the browser.
- Plaid webhooks are JWT-signature + body-hash verified before acting.
- Security headers (HSTS, nosniff, frame-deny, referrer-policy) on every
  response; bank data is only ever fetched server-side.

---

## Architecture

```
src/
  lib/
    types.ts        domain model (Plaid-aligned)
    store.ts        encrypted Blob/file datastore (swap to Postgres here)
    crypto.ts       AES-256-GCM + password hashing
    auth.ts         iron-session single-user auth
    analytics.ts    net worth, spending, cash flow, merchants
    categories.ts   Plaid PFC taxonomy → labels/colors
    sync.ts         merge provider results, preserve user edits
    providers/
      plaid.ts      Plaid Link, exchange, /transactions/sync, recurring
      csv.ts        flexible CSV importer (Chase/Amex/etc.)
  app/
    (app)/          authenticated dashboard pages
    api/            route handlers (auth, plaid, import, cron, …)
    login/ oauth/   public auth + Plaid OAuth return
  components/       UI + hand-rolled SVG charts
```

## Validation

Use Node.js 22. Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` before release. Tests use fixed dates for credit-period checks.
