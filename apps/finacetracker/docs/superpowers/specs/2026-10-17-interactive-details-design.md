# Interactive financial details

2026-10-17 · Specification for implementation

## Goal

Every financial summary must explain its value and expose its supporting records.
Clicking a category amount must open that category in the selected period. The
user must not need to find the same records again in Activity.

## Current gaps

- `TimeSeriesChart` renders exact values as plain text. This includes the category
  amounts in the supplied screenshot.
- `DataTable` supports row selection and one row link, but numeric cells cannot
  open their own breakdown.
- Summary cards, chart segments, account balances, and several merchant and
  transaction lists have no common detail action.
- Some category links omit dates. Activity's merchant parameter becomes a text
  search, which can include unrelated records.
- Activity omits synthetic estimates. Sending every total there cannot explain
  totals that include estimates or employer-paid support.

## Interaction contract

1. A label and its value form one visible detail link. Use an underline or a
   chevron, a hover state, and a visible keyboard focus state. Do not require hover.
2. Activate with click, tap, or Enter. Chart controls also support Space. Focus
   and pointer hover may preview a period; they must not navigate.
3. Open a shared detail panel over the current page. On narrow screens use the
   full viewport. Keep the origin's period, chart selection, table controls, and
   scroll position. Closing restores focus to the trigger.
4. Use a real detail URL. Opening in a new tab, refreshing, and browser Back must
   work. Direct URLs render a full detail page with the same contents.
5. Opening a detail never changes a category, marks a credit used, or saves data.
   Keep edit actions separate and explicitly labeled.
6. A zero value opens its explanation. Distinguish no records from offsetting
   charges and refunds. A missing value opens the reason it cannot be calculated.
7. No fabricated detail. If the source stores only an aggregate, show that
   aggregate and its limitations. Do not infer account balances for past dates.

## Screenshot behavior

For October 2026:

- `Shopping $2,464.77` opens October Shopping entries and their net total.
- `Food & Drink $1,060.99` opens October Food & Drink entries.
- `Other −$120.00` shows the contributing refunds/credits and charges. Explain
  that a negative spending total means credits exceeded charges.
- `Rent & Utilities $0.00` explains the empty or offsetting result. If rent is
  excluded, retain that setting. Utilities remain eligible under the current rule.
- `$4,805.94 total` opens all contributing October categories and records.
- These are screenshot totals, not values to hardcode into the implementation.

## Detail panel

Order the content as follows:

1. Sticky header: title, full period, Close, and Open full page.
2. Scope: account, currency, period, category/source, and applicable filters.
3. Exact total and a plain-language calculation. Separate recorded amounts,
   refunds, and estimates. Show a count for each type.
4. Supporting records in `DataTable`. Retain search, sort, columns, pagination,
   CSV export, fixed headers, and scrolling. Search totals are labeled separately
   from the full detail total.
5. Record details: full bank description, merchant, date, account, amount,
   effective category, original category when different, source, pending/hidden
   status, and note. Do not truncate the only available description.
6. Relevant actions: inspect a record, open exact Activity filters where supported,
   or open the existing estimate/support/account editor. Do not pretend an estimate
   is a bank transaction.

Use existing colors, spacing, `DataTable`, `AppLink`, and transaction editing
operations. Do not add a UI library. Keep one panel open. A nested record replaces
panel contents; Back returns to the prior detail. Do not stack dialogs.

## Coverage

| Surface | Activation | Required detail |
| --- | --- | --- |
| Monthly category charts | Segment, category readout, category table cell | Exact category and month, charges, refunds, estimates |
| Chart monthly total | Total/readout/period action | All series contributing to that month |
| Income charts and source tables | Source amount or source name | Exact normalized payer, selected months, deposits; support shown separately |
| Other deposits | Amount or record | Deposit description and reason it is excluded from income |
| Income/spending summary cards | Value | Exact months and contributing records |
| Net surplus and savings rate | Value/point/cell | Income minus spending; rate numerator and denominator; undefined when income is zero |
| Comparison and average values | Value/cell | Both date sets, totals, divisor, and difference; no division by zero |
| Daily and weekday spending | Point/readout/cell | Exact day or weekday within the parent window |
| Spending pace | Point/readout/cell | Cumulative dates through that day, current and comparison windows |
| Category and merchant lists | Label/amount | Exact category or merchant within the parent window |
| Recent/largest transactions | Name/amount | Full single-record details and separate Edit action |
| Net worth | Value and date | Assets minus liabilities; recorded vs reconstructed; daily flow is not a full balance reconciliation |
| Accounts | Balance/name | Current reported balances, account metadata, manual entry where applicable, related records |
| Recurring and upcoming bills | Stream/amount | Detection method, cadence, last charge, prediction, matching history where available |
| Credit cards/Bilt | Summary or calculation | Existing card detail plus evidence, applicable credit period, assumptions, and manual overrides; inspecting must not toggle usage |
| Settings | Connection/import counts | Available connection metadata and records; existing management actions remain explicit |

Text labels, decorative legends, dates without additional data, and ordinary
form fields need no artificial action. Every displayed financial aggregate must
have a meaningful detail or explanation action. An unavailable evidence source
must be labeled as unavailable.

## Data and filter rules

- Build details from the same scoped state and predicates as the parent metric.
  Reuse `isSpend`, `isIncome`, `resolveCategoryKey`, baseline injection,
  `filterBySource`, housing exclusion, and the existing card/recurring helpers.
- Pass explicit account scope, selected date set, metric, and category/source key.
  Do not derive filters from formatted labels or a substring search.
- Normalize the descriptor once. Keep it serializable for server components,
  chart series, table cells, and links. Validate incoming dates, enums, keys,
  and account IDs. Invalid scopes must not silently become All accounts.
- Preserve non-contiguous month sets used by existing analytics. Comparisons
  carry their own exact dates. Current partial months remain partial.
- Preserve income source, rent exclusion, and employer support settings. The
  support toggle affects only metrics that include support today.
- Count only contributing records. Pending, hidden, transfers, and other deposits
  follow the parent metric's inclusion rules. Show exclusion reasons when a
  record itself is inspected.
- Keep stored bank amount signs. Label the displayed metric contribution clearly:
  income is received money; spending is charges minus spending credits.
- Never sum different currencies into a new total. Separate them or show that
  the existing aggregate has no currency conversion.
- Estimates and employer support have their own rows and explanations. They
  remain outside the raw Activity ledger.
- Recompute on open. If records changed since the parent rendered, report that
  the detail is current and allow refresh. Never force rows to match stale totals.
- Historical net-worth snapshots currently store aggregate balances only. Expose
  this limitation. Add provenance to the read model when needed, not invented
  historical account allocations.

## Ownership and extension points

- Extend `TimeSeriesChart` point/series metadata with explicit detail links.
  Add separate value actions; keep period preview independent of activation.
- Extend `DataRow` with per-cell links. Keep raw values separate so sorting and
  CSV output do not contain UI markup. Extend `DataTable` rendering only.
- Extend `StatCard` with an optional detail link. Reuse this for summaries.
- Add `src/lib/details.ts` for the app's detail descriptor, URL validation, and
  pure resolution. This owns financial meaning; UI components do not classify.
- Add `src/components/DetailPanel.tsx` for panel navigation, focus, loading, and
  rendering. Mount once in the authenticated layout. Reuse its content on the
  canonical `/details` route. The new route serves direct links.
- If lazy data is required, add authenticated `/api/details` using the same
  resolver. Send only the records needed for the requested detail. Do not embed
  the complete ledger in every chart or expose provider tokens.
- Put resolver tests in `tests/details.test.ts` and interaction tests alongside
  existing chart/table tests. Match the project's existing names and style.

## Loading, failures, and navigation

Open the shell immediately with its known title. If records take more than
450 ms, show a labeled skeleton inside it. Do not open the global loading tray
for the same request. Keep Close available throughout loading and failures.
Abort or ignore obsolete requests when selection changes. Only the latest
selection can replace panel contents. A failed load shows Retry and the full
page link. Do not show an empty result for an error.

Use a native dialog with a label, focus containment, Escape, background scroll
lock, and focus return. On initial open focus the heading or Close button.
Keyboard users can reach every detail without interacting with SVG hit targets.
Use at least 44 px touch targets. Allow horizontal scrolling only inside tables.
Test light/dark themes, 390 px, 820 px, 1280 px, and 200% zoom. Respect reduced
motion. Avoid announcing the entire record table after each chart hover.

Opening adds a history entry. Closing returns to the origin without leaving the
app when the panel was opened there. Direct `/details` visits use an explicit
Back to overview action. Nested inspection uses the same panel and records its
prior detail. Browser Back and Forward reproduce that sequence.

## Implementation sequence

1. Add shared descriptor, resolver, detail page/panel, and reconciliation tests.
2. Wire category readouts, chart segments, table cells, and summary cards.
3. Wire source, merchant, daily, comparison, transaction, account, recurring,
   and card evidence actions. Audit each surface in the coverage table.
4. Verify keyboard, touch, Back/Forward, loading, errors, and exact totals.

## Acceptance checks

- Each screenshot amount opens the correct October subset. September and October
  remain visible in the chart. Opening details does not change the chart range.
- Category charges minus refunds plus estimates equals the selected total to the
  currency's display precision. A negative category and offsetting zero both work.
- Exact payer/merchant matching does not include a similarly named entity.
- Rent exclusion, account selection, income source, support, partial dates,
  non-contiguous months, and comparison windows survive drill-down and reload.
- A savings rate with zero income shows an explanation, not 0% or Infinity.
- All table numeric cells with meaningful detail use the same scoped resolver.
  Sorting/search/export still use raw values. Rate/balance totals are not summed.
- Transaction inspection exposes full text. Editing uses the existing save path.
  Merely opening a card credit never changes its usage state.
- Historical balance detail labels reconstruction and missing account-level data.
- Zero, missing records, deleted accounts, mixed currencies, stale data, slow
  requests, failed requests, and rapid successive selections have explicit states.
- Closing restores origin focus and state. Back/Forward and direct URLs work.
- Run Node 22 typecheck, lint, tests, and production build. Test actual React
  interactions, not only generated HTML. Record coverage gaps before release.

## Scope boundaries

This work adds inspection and navigation. It does not change financial inclusion
rules, invent merchant identities, rewrite bank records, add forecasts, or trigger
bank sync when a detail opens. Existing edit forms remain the source of changes.

## Implementation record

Implemented in this working tree on 2026-10-17. Canonical `/details` links open
one native dialog through the authenticated layout. The origin URL stores its
open detail in `?detail=`. Direct `/details` visits render the same detail content.
`/api/details` validates authentication and filters before returning supporting
records. Category, income, cash flow, daily, weekday, balance, recurring, Bilt,
and connection details share the resolver.

Card portfolio and per-card calculations use inline disclosures and `DataTable`.
They retain the current browser's usage overrides. Credit-period disclosures show
period evidence and provide separate mutation buttons. This is an intentional
exception to the shared dialog: these values depend on existing client state.
The card disclosures do not have independent share URLs.

Historical account allocations remain unavailable because the saved snapshots
contain aggregate balances only. Recurring matching-name links are labeled as
lookups; stream records do not retain exact contributing transaction IDs.

Validation completed: Node 22 typecheck, lint, 207 tests, and production build.
Chromium checks covered 390 px, 820 px, and 1280 px, light/dark themes, chart
Enter/Space actions, nested inspection, Back, Close, Escape, and table overflow.
An isolated production server with sample data verified authentication, exact
record totals, filter preservation, direct detail URLs, and reloads. Explicit
compact-number precision fixes a Node/Chromium hydration mismatch found in that
check. No production data was used or changed. This implementation is not deployed.
