# finacetracker audit remediation

2026-10-17 · Approved for implementation by the owner's request to specify, implement, and deploy all audit findings.

## Scope

Resolve F01–F14 from the 17 October audit. Rename the product to **finacetracker**, exactly as requested. Ship one verified release. Preserve all financial records, edits, credentials, and production domain routing. The audit describes the starting revision; this spec describes the target behavior.

## Ownership and reuse

Keep calculations in `src/lib/analytics.ts`, provider behavior in `src/lib/providers/plaid.ts`, persistence in `src/lib/store.ts`, and card rules in `src/lib/cards.ts`. Reuse `DetailProvider`, `DataTable`, `SectionCard`, `LoadingFeedback`, and `useSavedRefresh`. Extend `table-data.ts` for one CSV text serializer. Use existing route authentication and storage conflict handling. No new UI library.

New `src/lib/currency.ts` owns explicit currency scopes used by analytics, pages, and details. `CurrencyPicker` owns only the viewing preference. New `BalanceCoverage` renders the shared unknown-balance notice. New `src/lib/backup.ts` owns version validation and additive restore planning; backup routes own authentication and encrypted transfer. `BackupManager` owns file selection, preview, and commit feedback. New `src/lib/card-overrides.ts` owns validation/merging of slot corrections; its route owns encrypted metadata writes. Add focused tests beside existing domain and interaction tests.

## Required behavior

### F01 / F11 — Bank connection recovery

- Settings offers Reconnect for a Plaid connection. Reconnect requests Link update mode with the existing encrypted access token, not a new item exchange.
- OAuth resume retains update-mode item identity. On success, sync that same item. Cancellation or failure preserves its bundle, cursor, history, and edits.
- Token creation validates the item ID and provider. Tokens never enter response bodies or logs except the short-lived Link token intended for the browser.
- Removal remains separate. If local deletion succeeds but Plaid revocation fails, show that distinction and direct the user to their bank's connected-app controls or Plaid Portal. Do not report access revoked when it is not confirmed.

### F02 — Balance completeness

- Null current balance means unknown. Show “Balance unavailable,” never a fabricated zero. Closed status does not prove a zero balance.
- Net-worth results expose completeness and excluded account identities. Numeric subtotals include known balances only and are labeled partial where required.
- Show last reported balances only with explicit historical labeling; store the last successful report date where available. Do not invent dates for existing records.
- Snapshots retain currency and completeness. Do not reconstruct a complete historical balance series from an incomplete current anchor. Details and tables expose the same limitations.

### F03 — Currency

- Never add different currencies without conversion. No exchange-rate service is introduced.
- Analytics operate in an explicit currency scope. Default to USD when present; otherwise choose a stable available currency. Expose a currency picker when more than one exists. Display the selected currency and excluded-currency notice.
- Account management groups totals by currency and formats each account in its own currency. Activity rows always use transaction currency.
- Detail links preserve currency. Account and individual-transaction details retain their native currency. Historic global entries without a currency use USD, matching the existing app's original configuration.
- USD card-catalog reward rules must not value non-USD spending as dollars. Explain unsupported card currency rather than estimating false rewards.

### F04 / F05 — Export and recovery

- Share CSV formula-safe text escaping between ledger and table exports. Keep numeric amounts numeric.
- Call CSV a transaction export for analysis. It is not an app backup.
- Add a versioned encrypted full-data backup containing raw connection bundles and metadata, including annotations, manual entries, baselines, snapshots, card statuses, and slot corrections. Do not export synthetic baseline rows as source transactions.
- Encryption uses the configured data key. The browser receives opaque ciphertext, never plaintext provider tokens. State clearly that restoring requires the same data key.
- Restore has two stages: validate/preview, then apply the displayed plan. Reject malformed versions, invalid relationships, duplicate IDs, oversized input, and conflicting existing records before writes.
- Restore is additive and repeatable. Preserve existing matching records; add missing records. Do not silently replace changed records. Show conflicts for review. Writes retain storage revision checks. If a multi-document restore fails partway, report partial completion and permit a safe retry. Never describe independent document writes as atomic.
- Test export/decrypt/restore in isolated local storage with complete invented data. Production restore is not part of deployment.

### F06 / F12 — Card consistency

- Bilt Overview uses the same active/reported eligibility as Cards. Closed, unavailable, or unlinked cards keep history but receive no current reward prompts.
- Persist credit-slot overrides in encrypted metadata. Validate card, credit, slot, and boolean values. Reset removes the override and restores detection.
- Migrate existing browser overrides once, without overwriting newer server corrections. Clear the browser copy only after confirmed persistence. Migration failure leaves it recoverable and shows retry feedback.
- Save errors do not present an override as stored. Other sessions load the server result. Card status and credit corrections use the shared saved/propagating feedback.

### F07 / F10 — Freshness and saves

- Separate transaction-sync time from successful balance-refresh time. Account refresh failures produce partial-success warnings while preserving previous balances and account availability.
- Settings and account details identify stale balance data. Do not claim all bank data is fresh because transactions synced.
- Use the existing bounded saved refresh sequence for manual entries, CSV import, connection changes, Bilt settings, and card changes. Show saved status while data propagates. Preserve actionable API warnings.
- Keep pending inputs disabled while requests run. Manual-entry creation uses a request ID so a repeated completed request cannot insert a duplicate.

### F08 / F09 — Periods and charts

- Calendar-period charts show every month between their bounds. A month without recorded activity is a gap, not proof of zero spending. Explicitly label missing coverage.
- Activity-month analyses may retain their existing denominator, but labels must say “months with recorded activity” and show actual date bounds. Charts include intervening empty calendar months. Never label a non-contiguous activity window as the last N calendar months.
- Show the denominator used in averages. Suppress percentages and comparisons when the required record is absent.
- Net-worth range controls never fall back to all history. A range with fewer than two points shows its available point(s) and “Not enough records to calculate change.” Table rows and headline dates match the selected range.

### F13 / F14 — Copy and links

- Split estimate actions into “Manage estimates” → Recurring and “Import history” → Settings.
- Security copy accurately states SameSite-lax and the scope of login throttling. Do not break OAuth by switching to strict merely to match old copy.

## Rename and migration

- Replace the old public product names with finacetracker in navigation, login, browser metadata, Plaid client name, filenames, package names, scripts, and documentation.
- Rename the repository directory and Vercel project to `finacetracker`. Update the project's root directory and deployment references. Keep `finance.dante4000.com` serving the same project and data.
- Existing storage object paths and encryption keys are compatibility identifiers, not branding. Keep legacy reads/writes where changing identifiers would split production data. Isolate and document compatibility constants. Preserve old cookies/local preferences through explicit fallback or migration. Do not perform a blind search/replace on production data.

## Security and operational follow-up

Resolve development dependency advisories where a compatible patch exists. Add an explicit session-revocation version tied to authentication configuration so password changes invalidate older sessions. Document the legacy SHA-256 configuration and stronger password-hash support if added; never expose or regenerate production secrets as part of branding. Keep the shared-rate-limit limitation explicit unless a durable provider is configured. Verify current issuer sources for affected Bilt behavior; other catalog projections remain labeled estimates with source links.

## Acceptance and deployment

- Add regression tests for all 14 findings, including the failure and migration paths above. Prefer domain and interaction tests over source-text snapshots.
- Run Node 22 tests, lint, typecheck, production build, and dependency audit. Verify isolated backup recovery.
- Review rendering at narrow and wide widths, both themes, keyboard controls, reduced motion, slow/error states, and negative/large values when browser tooling permits. Report any concrete tooling blocker; do not mark blocked visual checks as passed.
- Commit only this app's files. Preserve unrelated monorepo work. Deploy through the existing Git integration after the root-directory update. Verify deployment commit, ready state, domain routing, authenticated behavior where accessible, and unauthenticated route protection.
- Record implementation and deployment evidence in this document. No further approval is needed for the work already requested.


## Implementation evidence

F01–F14 are implemented. New domain tests cover reconnect and provider failure,
missing balances, currencies, calendar gaps, closed Bilt cards, CSV escaping,
backup validation and recovery, correction migration, and session revocation.
An interaction test verifies narrow net-worth ranges. `scripts/release-smoke.ts`
checks authenticated pages and write routes with isolated fake data. Currency
scoping also covers recurring estimates and new CSV accounts. `DetailCurrencyScope`
reuses the existing panel while keeping the USD card catalog in its native scope.

Production dependency audit: zero reported vulnerabilities. Five development
advisories remain in the ESLint dependency chain; the affected braces advisory
has no published patch. No framework downgrade was made to hide that result.

Live visual checks remain blocked: browser inventory returned no controllable
tabs; the native browser returned stale screenshots, and Chrome selection timed
out. Automated interaction and HTTP tests do not establish visual conformance.
No production restore, bank removal, or live reconnect was run for validation.

Release checks: Node 22.23.3; 224 tests passed; lint and typecheck passed;
Next.js production build passed; isolated HTTP smoke passed for nine pages,
authentication, currency scopes, missing balances, export, restore conflicts,
idempotent writes, and corrections across sessions.


## F15 — Streamed page authorization

Release verification reproduced an additional defect with invented fixture data:
an invalid session cookie passed the optimistic proxy, and child page data
entered the streamed response before the layout redirect. Protect every page's
data load, not only its layout. Extend `src/lib/scoped-state.ts` with the shared
authenticated loader. Accounts, Cards, Settings, Details, and scoped analytics
must use it. Keep API authentication and background storage access unchanged.
Acceptance: invalid-session responses for all protected pages contain no fixture
account, merchant, institution, or note. Check both HTML and RSC requests.


F15 validation: all 11 protected page routes reject invalid sessions without
fixture data in HTML and RSC responses. All 224 tests, lint, typecheck, and the
production build pass. The full isolated HTTP smoke also passes after this fix.

Deployment record: release `639575c544754223cb1696e7da11eb683e94f830` reached
READY as `dpl_99ynxZKBZckoJshWEzmHA5VF37fy` on the preserved production domain.
The project is now `finacetracker`, root `apps/finacetracker`, Node 22.x.
The old Vercel domain redirects to `finance.dante4000.com`. Public login branding
and unauthenticated API denial passed. Local session credentials did not match
production, so authenticated production checks were not counted as passed.
The F15 follow-up is deployed through the same Git integration.
