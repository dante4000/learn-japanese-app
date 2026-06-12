# Global account filter + full transaction history

2026-06-12 · approved by Daniel

## Problems

1. Every page aggregates all accounts. The only per-account view is a small
   dropdown on the Activity page. Daniel wants to separate views by account.
2. Transaction history only reaches back to mid-March 2026. Cause: the Plaid
   Link token is created without `transactions.days_requested`, and Plaid's
   default is 90 days (June 12 − 90 days ≈ March 14).

## Decisions (from brainstorming)

- **Global account filter**: a persistent picker that scopes every page —
  Overview, Spending, Activity, Recurring — to one account or all.
- **Single account or All** (no multi-select, no institution grouping). Easy
  to extend later.
- **Sticky cookie persistence** (`vault_account`), not URL params. Single-user
  app; the filter is a viewing mode that follows you across pages/sessions.

## Design

### Full history fix

`createLinkToken()` in `src/lib/providers/plaid.ts` adds
`transactions: { days_requested: 730 }` (Plaid's max, 24 months).
`days_requested` is fixed per Item at link time, so existing connections must
be removed and re-linked in Settings to backfill older history. Re-linking
creates new transaction ids, so user edits (category overrides, notes, hidden
flags) on those transactions are lost. CSV imports already contain everything
in the file.

### Account filter

- **`src/lib/account-filter.ts`** (pure, importable from client and server):
  - `ACCOUNT_COOKIE = "vault_account"`
  - `filterStateByAccount(state, accountId)` — returns state narrowed to one
    account: filters `accounts`, `transactions`, `recurring`, `items`; empties
    `manualEntries` and `snapshots` (those are global, not per-account).
    Unknown/absent id → state unchanged (handles deleted accounts).
- **`loadStateCached`** in `src/lib/store.ts` — `React.cache()` wrapper around
  `loadState` so layout + page share one blob read per request. The uncached
  `loadState` remains for sync paths that read after writing.
- **`AccountPicker`** client component — styled native `<select>` with
  "All accounts" plus each account (institution-grouped via `<optgroup>`,
  label includes mask). On change: writes the cookie (1-year max-age, or
  clears it for All) and `router.refresh()`. Rendered by `AppShell` in the
  desktop sidebar above the nav and under the mobile top bar; hidden when
  fewer than two accounts exist.
- **`(app)/layout.tsx`** loads state (cached), reads the cookie, validates the
  id against existing accounts, and passes picker options + selection to
  `AppShell`.
- **Pages** read the cookie and compute everything from
  `filterStateByAccount(await loadStateCached(), id)`:
  - **Overview**: when an account is focused, the net-worth hero becomes an
    account hero (name, mask, current balance, available/limit, institution);
    the historical net-worth chart and assets/owed split are hidden (global
    only). All other stats/charts recompute from the scoped state.
  - **Spending / Activity / Recurring**: recompute from scoped state. The
    Activity page's local account dropdown auto-hides (it already requires
    >1 account in scope).
  - **Accounts**: always shows everything (management view); each account row
    gains a "View" action that sets the filter and navigates to Overview.

### Out of scope

Multi-select, per-account net-worth history (snapshots are global), Plaid
update-mode re-link.

## Verification

`npm run build` for types; run dev against the local `.data` store and click
through every page with the filter on/off, including a stale-cookie case.
