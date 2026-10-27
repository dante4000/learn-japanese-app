import test from 'node:test';
import assert from 'node:assert/strict';
import { detailHref, parseDetail, resolveDetail, type DetailData } from '../src/lib/details';
import { emptyState, type Account, type Transaction } from '../src/lib/types';
import { injectBaselines } from '../src/lib/analytics';
const account: Account = { id: 'checking', itemId: 'bank', name: 'Checking', officialName: null, type: 'depository', subtype: 'checking', mask: '1234', currency: 'USD', source: 'plaid', balances: { current: 1000, available: 900, limit: null } };
function tx(id: string, amount: number, category = 'GENERAL_MERCHANDISE', fields: Partial<Transaction> = {}): Transaction {
  return { id, amount, accountId: account.id, date: '2026-10-01', currency: 'USD', name: id, merchantName: null, categoryPrimary: category, categoryDetailed: null, userCategory: null, pending: false, hidden: false, source: 'plaid', paymentChannel: null, note: null, ...fields };
}
function state(...transactions: Transaction[]) { return { ...emptyState(), accounts: [account], transactions }; }
const value = (data: DetailData, label: string) => data.summary.find((s) => s.label === label)?.value;

test('category details reconcile purchases, refunds and estimates without other categories or months', () => {
  const data = resolveDetail(state(tx('shop', 2600), tx('credit', -135.23), tx('food', 50, 'FOOD_AND_DRINK'), tx('September', 999, 'GENERAL_MERCHANDISE', { date: '2026-09-01' }), tx('pending', 5, 'GENERAL_MERCHANDISE', { pending: true }), tx('hidden', 6, 'GENERAL_MERCHANDISE', { hidden: true })), { metric: 'spending', category: 'GENERAL_MERCHANDISE', months: ['2026-10'] });
  assert.equal(value(data, 'Shopping · Net spending'), 2464.77);
  assert.equal(data.rows.length, 2);
  assert.equal(value(data, 'Posted purchases'), 2600);
  assert.equal(value(data, 'Refunds / credits'), 135.23);
});
test('zero from offsetting records differs from an empty category; negative credits remain inspectable', () => {
  const full = state(tx('charge', 120, 'OTHER'), tx('refund', -120, 'OTHER'));
  const zero = resolveDetail(full, { metric: 'spending', category: 'OTHER' });
  assert.equal(value(zero, 'Other · Net spending'), 0); assert.equal(zero.rows.length, 2);
  const empty = resolveDetail(full, { metric: 'spending', category: 'MEDICAL' });
  assert.equal(empty.rows.length, 0); assert.match(empty.notes.join(' '), /No contributing entries/);
  const negative = resolveDetail(state(tx('refund', -120, 'OTHER')), { metric: 'spending', category: 'OTHER' });
  assert.equal(negative.rows[0].values.contribution, -120);
});
test('synthetic estimates appear separately and respect account scope and housing exclusion', () => {
  const full = injectBaselines({ ...state(tx('utility', 40, 'RENT_AND_UTILITIES', { name: 'Electric utility' })), baselines: [{ id: 'rent', name: 'Rent', amount: 1000, category: 'RENT_AND_UTILITIES', startMonth: '2026-10' }] });
  const data = resolveDetail(full, { metric: 'spending', months: ['2026-10'] });
  assert.equal(value(data, 'Estimates'), 1000);
  assert.equal(value(resolveDetail(full, { metric: 'spending', months: ['2026-10'], rent: 'exclude' }), 'Net spending'), 40);
  assert.equal(value(resolveDetail(full, { metric: 'spending', account: account.id }), 'Estimates'), 0);
});
test('source and merchant drill-downs use exact identity, not a text substring', () => {
  const full = state(tx('Acme', -1000, 'INCOME'), tx('Acme Holdings', -500, 'INCOME'), tx('Shop', 10), tx('Shop Outlet', 20));
  assert.equal(resolveDetail(full, { metric: 'income', source: 'Acme' }).rows.length, 1);
  assert.equal(resolveDetail(full, { metric: 'spending', merchant: 'Shop' }).rows.length, 1);
});
test('refunds and other deposits do not become income; rates explain zero denominators', () => {
  const full = state(tx('payroll', -1000, 'INCOME'), tx('IRS TREAS 310 TAX REF', -500, 'INCOME'), tx('purchase', 200), tx('refund', -50));
  const data = resolveDetail(full, { metric: 'rate', months: ['2026-10'] });
  assert.equal(value(data, 'Income'), 1000); assert.equal(value(data, 'Net spending'), 150); assert.equal(value(data, 'Savings rate'), 85);
  assert.equal(resolveDetail(full, { metric: 'deposits' }).rows.length, 1);
  assert.equal(value(resolveDetail(state(tx('purchase', 5)), { metric: 'rate' }), 'Savings rate'), null);
});
test('explicit non-contiguous months, weekdays and date ranges retain exact membership', () => {
  const full = state(tx('October Thursday', 10), tx('September', 20, undefined, { date: '2026-09-01' }), tx('August Thursday', 30, undefined, { date: '2026-08-06' }), tx('October Friday', 40, undefined, { date: '2026-10-02' }));
  const data = resolveDetail(full, { metric: 'spending', months: ['2026-08', '2026-10'], weekday: 4 });
  assert.equal(value(data, 'Net spending'), 40); assert.equal(data.rows.length, 2);
  assert.equal(value(resolveDetail(full, { metric: 'spending', from: '2026-10-01', to: '2026-10-01' }), 'Net spending'), 10);
});
test('monthly comparison uses the prior divisor and exposes the comparison records', () => {
  const full = state(tx('oct', 100), tx('aug', 20, undefined, { date: '2026-08-01' }), tx('sep', 60, undefined, { date: '2026-09-01' }));
  const data = resolveDetail(full, { metric: 'spending', months: ['2026-10'], priorMonths: ['2026-08', '2026-09'], priorAverage: true });
  assert.equal(value(data, 'Prior monthly average'), 40); assert.equal(value(data, 'Change'), 60); assert.equal(value(data, 'Change (%)'), 150);
  assert.match(data.actions[0].href, /2026-08%2C2026-09/);
});
test('missing prior month stays unavailable, while a recorded zero has no percent change', () => {
  const data = resolveDetail(state(tx('oct', 100)), { metric: 'net', months: ['2026-10'], priorMonths: ['2026-09'] });
  assert.equal(value(data, 'Previous period'), null); assert.equal(value(data, 'Change (%)'), null);
});
test('support is a separate non-cash contribution and never appears under a focused account', () => {
  const full = { ...state(tx('Acme', -1000, 'INCOME')), employerHousingSupport: { source: 'Acme', amount: 800, startMonth: '2026-10', endMonth: null } };
  const query = { metric: 'income' as const, months: ['2026-10'], support: 'include' as const };
  assert.equal(value(resolveDetail(full, query), 'Income'), 1800);
  assert.equal(value(resolveDetail(full, { ...query, account: account.id }), 'Income'), 1000);
  const support = resolveDetail(full, { metric: 'support', months: ['2026-10'] });
  assert.equal(support.rows.length, 1); assert.equal(support.rows[0].values.kind, 'Employer-paid support');
});
test('record inspection preserves full text, flags and original categories', () => {
  const t = tx('record', -50, 'INCOME', { name: 'A long original description ' + 'with detail '.repeat(30), userCategory: 'OTHER_INFLOW', note: 'Review', hidden: true });
  const data = resolveDetail(state(t), { metric: 'transaction', record: t.id, account: account.id });
  assert.equal(data.rows[0].values.description, t.name); assert.equal(data.transaction?.note, 'Review'); assert.match(data.notes.join(' '), /Original category: INCOME/); assert.match(data.notes.join(' '), /Hidden and pending/);
});
test('historical net worth exposes recorded aggregate provenance without current account rows', () => {
  const full = { ...state(), snapshots: [{ date: '2026-10-01', netWorth: 700, totalAssets: 1000, totalLiabilities: 300 }] };
  const data = resolveDetail(full, { metric: 'networth', to: '2026-10-01' });
  assert.equal(value(data, 'Net worth'), 700); assert.match(data.notes.join(' '), /Historical balances for individual accounts were not stored/); assert.equal(data.rows[0].values.balance, undefined);
});
test('mixed currencies have no combined total or additive footer', () => {
  const data = resolveDetail(state(tx('USD', 100), tx('EUR', 50, undefined, { currency: 'EUR' })), { metric: 'spending' });
  assert.equal(data.summary.length, 0); assert.ok(data.columns.every((c) => !c.total)); assert.match(data.notes.join(' '), /Multiple currencies/);
});
test('descriptor validation rejects bad scope and round-trips exact filters', () => {
  const query = { metric: 'spending' as const, account: 'checking', months: ['2026-08', '2026-10'], merchant: 'A & B', rent: 'exclude' as const, priorAverage: true };
  assert.deepEqual(parseDetail(new URL(detailHref(query), 'http://localhost').searchParams), query);
  for (const bad of ['metric=wrong', 'metric=spending&months=2026-13', 'metric=spending&from=2026-02-30', 'metric=spending&weekday=8', 'metric=spending&category=FAKE', 'metric=spending&rent=yes']) assert.throws(() => parseDetail(new URLSearchParams(bad)));
  assert.throws(() => resolveDetail(state(), { metric: 'spending', account: 'deleted' }), /no longer available/);
});

test('weekday details exclude synthetic bills and use all weekdays for share', () => {
  const full = injectBaselines({ ...state(tx('Thursday', 30), tx('Friday', 70, undefined, { date: '2026-10-02' })), baselines: [{ id: 'rent', name: 'Rent', amount: 1000, category: 'RENT_AND_UTILITIES', startMonth: '2026-10' }] });
  const data = resolveDetail(full, { metric: 'spending', months: ['2026-10'], weekday: 4, statistic: 'share' });
  assert.equal(value(data, 'Net spending'), 30); assert.equal(value(data, 'Share of total'), 30);
});

test('details API rejects unauthenticated requests before reading records', async () => {
  const { GET } = await import('../src/app/api/details/route');
  const response = await GET(new Request('http://localhost/api/details?metric=spending'));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'Sign in to view details.' });
});

test('a prior month with recorded transfers has a real zero cash-flow value', () => {
  const full = state(tx('oct', 100), tx('transfer', -500, 'TRANSFER_IN', { date: '2026-09-01' }));
  const data = resolveDetail(full, { metric: 'net', months: ['2026-10'], priorMonths: ['2026-09'] });
  assert.equal(value(data, 'Previous period'), 0); assert.equal(value(data, 'Change'), -100); assert.equal(value(data, 'Change (%)'), null);
});
