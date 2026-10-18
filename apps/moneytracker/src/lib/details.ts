import type { AppState, Transaction } from './types';
import type { DataColumn, DataRow } from './table-data';
import { isIncome, isSpend, isSyntheticBaseline, computeNetWorth, netWorthHistory, allRecurringStreams, todayKey, LIABILITY_TYPES, isTransferStream, upcomingBills, dailySpending } from './analytics';
import { CATEGORIES, categoryMeta, resolveCategoryKey, isHousingTransaction, nonIncomeDepositReason } from './categories';
import { incomeSourceLabel, displayPayee } from './aliases';
import { filterStateByAccount } from './account-filter';
import { monthlyEquivalent } from './recurring';
import { resolveBiltMeter, biltEverydaySpend } from './bilt';
import { employerHousingSupportTotal, eligibleEmployerHousingSupport } from './income-support';

export type DetailMetric = 'spending' | 'income' | 'net' | 'rate' | 'deposits' | 'ledger' | 'transaction' | 'networth' | 'account' | 'recurring' | 'support' | 'upcoming' | 'bilt' | 'connection';
export interface DetailQuery {
  metric: DetailMetric;
  account?: string;
  months?: string[];
  from?: string;
  to?: string;
  category?: string;
  merchant?: string;
  source?: string;
  denominatorSource?: string;
  record?: string;
  weekday?: number;
  rent?: 'exclude';
  support?: 'include';
  part?: 'purchases' | 'refunds' | 'estimates' | 'recorded';
  statistic?: 'count' | 'average' | 'monthly' | 'change' | 'changePct' | 'share' | 'daily';
  priorAverage?: boolean;
  streamType?: 'inflow' | 'outflow';
  annual?: boolean;
  priorMonths?: string[];
  priorFrom?: string;
  priorTo?: string;
}
const metrics: DetailMetric[] = ['spending', 'income', 'net', 'rate', 'deposits', 'ledger', 'transaction', 'networth', 'account', 'recurring', 'support', 'upcoming', 'bilt', 'connection'];
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value; }
export function detailHref(query: DetailQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value !== undefined) params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  return `/details?${params}`;
}
export function parseDetail(params: URLSearchParams): DetailQuery {
  const metric = params.get('metric') as DetailMetric;
  if (!metrics.includes(metric)) throw new Error('Choose a valid detail type.');
  const result: DetailQuery = { metric };
  for (const key of ['account', 'category', 'merchant', 'source', 'denominatorSource', 'record'] as const) {
    const value = params.get(key);
    if (value !== null) { if (!value || value.length > 500) throw new Error('Invalid detail filter.'); result[key] = value; }
  }
  for (const key of ['months', 'priorMonths'] as const) {
    const value = params.get(key);
    if (value !== null) {
      const months = [...new Set(value.split(','))].sort();
      if (months.length > 240 || months.some((m) => !monthPattern.test(m))) throw new Error('Invalid month selection.');
      result[key] = months;
    }
  }
  for (const key of ['from', 'to', 'priorFrom', 'priorTo'] as const) {
    const value = params.get(key);
    if (value !== null) { if (!validDate(value)) throw new Error('Invalid date.'); result[key] = value; }
  }
  if (result.from && result.to && result.from > result.to || result.priorFrom && result.priorTo && result.priorFrom > result.priorTo) throw new Error('The start date must precede the end date.');
  if (params.has('weekday')) {
    const value = Number(params.get('weekday'));
    if (!Number.isInteger(value) || value < 0 || value > 6) throw new Error('Invalid weekday.');
    result.weekday = value;
  }
  const enums = { rent: ['exclude'], support: ['include'], part: ['purchases', 'refunds', 'estimates', 'recorded'], statistic: ['count', 'average', 'monthly', 'change', 'changePct', 'share', 'daily'], streamType: ['inflow', 'outflow'] } as const;
  for (const key of Object.keys(enums) as (keyof typeof enums)[]) {
    const value = params.get(key);
    if (value !== null) { if (!(enums[key] as readonly string[]).includes(value)) throw new Error('Invalid calculation option.'); Object.assign(result, { [key]: value }); }
  }
  for (const key of ['priorAverage', 'annual'] as const) if (params.has(key)) { if (params.get(key) !== 'true') throw new Error('Invalid calculation option.'); result[key] = true; }
  if (result.category && !CATEGORIES[result.category]) throw new Error('Unknown category.');
  return result;
}
export interface DetailData {
  title: string;
  scope: string[];
  currency: string;
  summary: { label: string; value: number | null; format: 'money' | 'number' | 'percent' }[];
  notes: string[];
  columns: DataColumn[];
  rows: DataRow[];
  actions: { label: string; href: string }[];
  transaction?: Transaction;
  accountName?: string;
}
const recordColumns: DataColumn[] = [
  { key: 'date', label: 'Date', format: 'date' }, { key: 'payee', label: 'Merchant / source' },
  { key: 'contribution', label: 'Contribution', format: 'money', total: true },
  { key: 'kind', label: 'Entry type' }, { key: 'account', label: 'Account' },
  { key: 'category', label: 'Category' }, { key: 'description', label: 'Full description' },
  { key: 'currency', label: 'Currency' }, { key: 'status', label: 'Status' },
  { key: 'source', label: 'Data source' }, { key: 'note', label: 'Note' },
];
export function resolveDetail(full: AppState, query: DetailQuery): DetailData {
  if (query.account && query.account !== 'all' && !full.accounts.some((a) => a.id === query.account)) throw new Error('This account is no longer available. Choose another account.');
  const state = filterStateByAccount(full, query.account === 'all' ? null : query.account);
  const currency = state.accounts[0]?.currency ?? 'USD';
  const names = new Map(full.accounts.map((a) => [a.id, a.name]));
  const periods = query.months?.map((month) => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`))).join(', ') ?? (query.from || query.to ? `${query.from ?? 'First record'} – ${query.to ?? 'Latest record'}` : 'All available dates');
  const result: DetailData = { title: 'Details', scope: [periods, query.account && query.account !== 'all' ? names.get(query.account)! : 'All accounts'], currency, summary: [], notes: ['Values use the current saved records. A recent sync or edit can change the result.'], columns: recordColumns, rows: [], actions: [] };
  if (query.rent) result.scope.push('Housing excluded; utilities included');
  if (query.source) result.scope.push(`Source: ${query.source}`);
  if (query.weekday !== undefined) result.scope.push(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][query.weekday]);
  const add = (label: string, value: number | null, format: 'money' | 'number' | 'percent' = 'money') => result.summary.push({ label, value, format });
  const inPeriod = (t: Transaction, q = query) => (!q.months || q.months.includes(t.date.slice(0, 7))) && (!q.from || t.date >= q.from) && (!q.to || t.date <= q.to) && (q.weekday === undefined || new Date(`${t.date}T00:00:00Z`).getUTCDay() === q.weekday);
  const row = (t: Transaction, contribution: number): DataRow => ({ id: `${t.accountId}:${t.id}`, href: detailHref({ metric: 'transaction', record: t.id, account: isSyntheticBaseline(t) ? 'all' : t.accountId }), linkLabel: 'Inspect entry', cellHrefs: Object.fromEntries(['date', 'payee', 'contribution'].map((key) => [key, detailHref({ metric: 'transaction', record: t.id, account: isSyntheticBaseline(t) ? 'all' : t.accountId })])), values: {
    date: t.date, payee: displayPayee(t.merchantName, t.name, names.get(t.accountId)), contribution,
    kind: isSyntheticBaseline(t) ? 'Estimate' : isIncome(t) ? 'Income' : isSpend(t) ? t.amount < 0 ? 'Refund / credit' : 'Purchase' : 'Other activity',
    account: names.get(t.accountId) ?? 'Manual estimate', category: categoryMeta(resolveCategoryKey(t)).label,
    description: t.name, currency: t.currency, status: [isSyntheticBaseline(t) ? 'Estimated · no posted charge' : t.pending ? 'Pending' : 'Posted', t.hidden ? 'Hidden' : ''].filter(Boolean).join(' · '), source: t.source, note: t.note,
  } });
  if (query.metric === 'transaction') {
    const t = state.transactions.find((t) => t.id === query.record);
    if (!t) throw new Error('This entry is no longer available. Refresh the original view.');
    result.title = displayPayee(t.merchantName, t.name, names.get(t.accountId));
    result.scope[0] = t.date; result.currency = t.currency;
    result.rows = [{ ...row(t, -t.amount), href: undefined, cellHrefs: undefined }]; result.columns = recordColumns.map((c) => c.key === 'contribution' ? { ...c, label: 'Money in / out' } : c);
    result.transaction = t; result.accountName = names.get(t.accountId);
    add('Money in / out', -t.amount);
    result.notes.push(`Bank description: ${t.name}`, `Effective category: ${categoryMeta(resolveCategoryKey(t)).label}. Original category: ${t.categoryPrimary}${t.categoryDetailed ? ` / ${t.categoryDetailed}` : ''}.`, isSyntheticBaseline(t) ? 'This is an estimated bill, not a bank transaction.' : isIncome(t) ? 'Included in income.' : isSpend(t) ? 'Included in spending; credits reduce spending.' : 'Excluded from income and spending.');
    const reason = nonIncomeDepositReason(t); if (reason) result.notes.push(reason);
    if (isSyntheticBaseline(t) && t.note) result.notes.push(t.note);
    if (t.hidden || t.pending) result.notes.push('Hidden and pending entries are excluded from income and spending summaries.');
    return result;
  }
  if (query.metric === 'account' || query.metric === 'networth') {
    const nw = computeNetWorth(state);
    const date = query.to;
    result.scope[0] = date ?? 'Current reported balances';
    const snapshot = date ? netWorthHistory(state, todayKey()).find((s) => s.date === date) : null;
    if (date && !snapshot) throw new Error('No balance record is available for this date.');
    result.title = query.metric === 'account' ? names.get(query.account ?? '') ?? 'Account balances' : 'Net worth';
    add('Assets', snapshot?.totalAssets ?? nw.totalAssets); add('Liabilities', snapshot?.totalLiabilities ?? nw.totalLiabilities); add('Net worth', snapshot?.netWorth ?? nw.netWorth);
    result.notes.push('Net worth = assets − liabilities. Cash flow alone does not reconcile balance changes.');
    if (date && query.priorTo) { const previous = netWorthHistory(state, todayKey()).find((s) => s.date === query.priorTo); add('Previous balance', previous?.netWorth ?? null); add('Balance change', previous ? snapshot!.netWorth - previous.netWorth : null); add('Balance change (%)', previous?.netWorth ? (snapshot!.netWorth - previous.netWorth) / Math.abs(previous.netWorth) * 100 : null, 'percent'); result.notes.push(`Previous available record: ${query.priorTo}.`); }
    if (date) {
      result.notes.push(full.snapshots.some((s) => s.date === date) ? 'Recorded aggregate snapshot. Historical balances for individual accounts were not stored.' : 'Reconstructed from current balances and transaction history. Historical account balances are not recorded.');
      result.columns = [{ key: 'date', label: 'Date', format: 'date' }, { key: 'assets', label: 'Assets', format: 'money' }, { key: 'liabilities', label: 'Liabilities', format: 'money' }, { key: 'net', label: 'Net worth', format: 'money' }];
      result.rows = [{ id: date, values: { date, assets: snapshot!.totalAssets, liabilities: snapshot!.totalLiabilities, net: snapshot!.netWorth } }];
    } else {
      result.columns = [{ key: 'name', label: 'Account / asset' }, { key: 'kind', label: 'Type' }, { key: 'balance', label: 'Reported balance', format: 'money' }, { key: 'available', label: 'Available', format: 'money' }, { key: 'limit', label: 'Limit', format: 'money' }, { key: 'currency', label: 'Currency' }, { key: 'source', label: 'Source' }, { key: 'availability', label: 'Availability' }];
      result.rows = state.accounts.map((a) => ({ id: a.id, href: detailHref({ metric: 'ledger', account: a.id }), linkLabel: 'Account activity', values: { name: `${a.name}${a.mask ? ` ···· ${a.mask}` : ''}`, kind: LIABILITY_TYPES.has(a.type) ? 'Liability' : 'Asset', balance: a.balances.current, available: a.balances.available, limit: a.balances.limit, currency: a.currency, source: a.source, availability: a.availability === 'unavailable' ? 'Not reported by Plaid; history retained' : 'Reported' } }));
      result.rows.push(...state.manualEntries.map((m) => ({ id: m.id, href: '/accounts', linkLabel: 'Edit manual entry', values: { name: m.name, kind: m.kind, balance: m.value, available: null, limit: null, currency, source: `Manual · ${m.asOf}` } })));
    }
    if (new Set(state.accounts.map((a) => a.currency)).size > 1) { result.summary = []; result.notes.push('Multiple currencies. No converted total is available. Read each account in its reported currency.'); }
    return result;
  }
  if (query.metric === 'connection') {
    const item = full.items.find((item) => item.id === query.record);
    if (!item) throw new Error('This connection is no longer available.');
    result.title = item.institutionName;
    result.notes.push(`Provider: ${item.provider}. Status: ${item.status}. Last sync: ${item.lastSyncedAt ?? 'Not synced'}.`);
    result.columns = [{ key: 'name', label: 'Account' }, { key: 'type', label: 'Type' }, { key: 'count', label: 'Saved transactions', format: 'number' }];
    result.rows = full.accounts.filter((a) => a.itemId === item.id).map((a) => ({ id: a.id, href: detailHref({ metric: 'ledger', account: a.id }), linkLabel: 'Inspect activity', values: { name: a.name, type: a.type, count: full.transactions.filter((t) => t.accountId === a.id).length } }));
    result.actions.push({ label: 'Manage connection', href: '/settings' });
    return result;
  }
  if (query.metric === 'bilt') {
    const meter = resolveBiltMeter(full, todayKey());
    if (!meter) throw new Error('No connected Bilt account.');
    result.title = 'Bilt rent rewards calculation'; result.scope = [meter.cycle.label, meter.account.name]; result.currency = meter.account.currency;
    add('Eligible everyday spend', meter.everydaySpend); add('Housing payment', meter.housingPayment); add('Spend / housing', meter.rewards.ratio * 100, 'percent'); add('Housing multiplier', meter.rewards.multiplier, 'number'); add('Estimated points', meter.rewards.points, 'number'); add('Spend to next tier', meter.rewards.toNext);
    result.notes.push(`Housing amount: ${meter.housingFromOverride ? 'manual override' : 'active housing baseline'}.`, 'Eligible spend excludes housing, bank fees, pending and hidden entries. Refunds reduce spend; the total has a floor of zero.', 'Points use the configured housing amount and the tier reached. Below the first tier the estimate is 250 points. No estimate applies without a housing amount.');
    const cycle = { ...meter.cycle, end: todayKey() < meter.cycle.end ? todayKey() : meter.cycle.end };
    result.rows = full.transactions.filter((t) => biltEverydaySpend([{ ...t, amount: Math.abs(t.amount) }], meter.account.id, cycle) > 0).map((t) => row(t, t.amount));
    result.actions.push({ label: 'Edit housing amount and cycle on Overview', href: '/' });
    return result;
  }
  if (query.metric === 'upcoming') {
    const upcoming = upcomingBills(state, todayKey(), 45);
    const bills = upcoming.bills.filter((b) => query.record ? b.id === query.record : b.daysUntil <= 30);
    result.title = query.record ? 'Predicted bill' : 'Bills due in the next 30 days';
    add('Predicted total', bills.reduce((sum, b) => sum + b.amount, 0));
    result.columns = [{ key: 'name', label: 'Bill' }, { key: 'date', label: 'Predicted date', format: 'date' }, { key: 'amount', label: 'Amount', format: 'money', total: true }, { key: 'frequency', label: 'Frequency' }];
    result.rows = bills.map((b) => ({ id: b.id, href: detailHref({ metric: 'recurring', account: query.account, record: b.id.slice(0, -11) }), linkLabel: 'Inspect stream', values: { name: b.name, date: b.nextDate, amount: b.amount, frequency: b.frequency } }));
    result.notes.push('Predictions use recurring payment history. These are not posted charges. Every expected occurrence in the selected horizon is counted.');
    return result;
  }
  let transactions = state.transactions.filter((t) => inPeriod(t) && (!query.rent || !isHousingTransaction(t)) && (query.weekday === undefined || !isSyntheticBaseline(t)) && (query.statistic !== 'daily' || t.date <= todayKey()) && (!query.category || resolveCategoryKey(t) === query.category) && (!query.merchant || (t.merchantName || t.name) === query.merchant) && (!query.source || incomeSourceLabel(t.merchantName, t.name) === incomeSourceLabel(null, query.source)));
  if (query.metric === 'recurring') {
    const streams = allRecurringStreams(state).filter((s) => (!query.record || s.id === query.record) && (!query.streamType || s.type === query.streamType && s.isActive && !isTransferStream(s) && (s.type !== 'inflow' || !nonIncomeDepositReason({ name: s.description, merchantName: s.merchantName }))));
    if (!streams.length) throw new Error('This recurring stream is no longer available.');
    result.title = 'Recurring payments';
    add('Monthly equivalent', streams.reduce((sum, stream) => sum + monthlyEquivalent(stream), 0));
    add('Annual equivalent', streams.reduce((sum, stream) => sum + monthlyEquivalent(stream) * 12, 0));
    result.notes.push('Monthly equivalents normalize the payment frequency. Annual equivalents multiply monthly equivalents by 12.');
    result.columns = [{ key: 'name', label: 'Stream' }, { key: 'frequency', label: 'Frequency' }, { key: 'average', label: 'Average payment', format: 'money' }, { key: 'last', label: 'Last payment', format: 'money' }, { key: 'date', label: 'Last date', format: 'date' }, { key: 'next', label: 'Predicted next date', format: 'date' }, { key: 'method', label: 'Detection' }];
    result.rows = streams.map((s) => ({ id: s.id, href: detailHref({ metric: 'ledger', account: s.accountId, merchant: s.merchantName || s.description }), linkLabel: 'Matching name activity', values: { name: s.merchantName || s.description, frequency: s.frequency, average: s.averageAmount, last: s.lastAmount, date: s.lastDate, next: s.predictedNextDate, method: s.inferred ? 'Detected from payment patterns' : 'Reported by provider' } }));
    result.notes.push('Future dates are predictions. Matching-name activity is a lookup, not proof that every matching charge belongs to this stream.');
    result.actions.push({ label: 'Manage recurring bills and estimates', href: '/recurring' });
    return result;
  }
  const metric = query.metric;
  transactions = transactions.filter((t) => metric === 'income' ? isIncome(t) : metric === 'spending' ? isSpend(t) : metric === 'net' || metric === 'rate' ? isSpend(t) || isIncome(t) : metric === 'deposits' ? !t.pending && !t.hidden && t.amount < 0 && !isIncome(t) && !isSpend(t) : metric === 'support' ? false : !isSyntheticBaseline(t));
  if (query.part) transactions = transactions.filter((t) => query.part === 'estimates' ? isSyntheticBaseline(t) : !isSyntheticBaseline(t) && (query.part === 'recorded' || (query.part === 'refunds' ? t.amount < 0 : t.amount > 0)));
  const titles = { spending: 'Net spending', income: 'Income', net: 'Surplus / shortfall', rate: 'Savings rate', deposits: 'Other money received', ledger: 'Activity', support: 'Employer-paid support' };
  result.title = `${query.category ? categoryMeta(query.category).label + ' · ' : query.merchant ? query.merchant + ' · ' : query.source ? query.source + ' · ' : ''}${titles[metric as keyof typeof titles]}`;
  let income = transactions.filter(isIncome).reduce((sum, t) => sum - t.amount, 0);
  const spending = transactions.filter(isSpend).reduce((sum, t) => sum + t.amount, 0);
  result.rows = transactions.sort((a, b) => b.date.localeCompare(a.date)).map((t) => row(t, metric === 'spending' ? t.amount : -t.amount));
  const support = eligibleEmployerHousingSupport(state.employerHousingSupport, query.source ?? '', Boolean(query.account && query.account !== 'all'));
  if ((metric === 'support' || query.support === 'include') && support) {
    const months = query.months ?? [...new Set(state.transactions.map((t) => t.date.slice(0, 7)))];
    for (const month of months) {
      const amount = employerHousingSupportTotal(support, [month]);
      if (!amount) continue;
      income += amount;
      result.rows.push({ id: `support:${month}`, href: '/income', linkLabel: 'Manage support', values: { date: `${month}-01`, payee: support.source, contribution: amount, kind: 'Employer-paid support', account: 'Paid outside bank accounts', category: 'Support', description: 'Configured monthly studio rent support', currency, status: 'Non-cash support', source: 'manual', note: null } });
    }
    result.notes.push('Employer-paid support is not a bank deposit. It is included only when requested.');
  }
  const total = metric === 'spending' ? spending : metric === 'income' || metric === 'support' ? income : metric === 'net' || metric === 'rate' ? income - spending : transactions.reduce((sum, t) => sum - t.amount, 0);
  if (metric === 'net' || metric === 'rate') { add('Income', income); add('Net spending', spending); add('Income − spending', total); }
  if (metric === 'rate') { add('Savings rate', income > 0 ? total / income * 100 : null, 'percent'); result.notes.push('Savings rate = (income − spending) ÷ income × 100. No rate is available when income is zero.'); }
  else add(metric === 'ledger' ? 'Money in − money out' : result.title, total);
  if (metric === 'spending') {
    add('Posted purchases', transactions.filter((t) => !isSyntheticBaseline(t) && t.amount > 0).reduce((sum, t) => sum + t.amount, 0));
    add('Refunds / credits', transactions.filter((t) => !isSyntheticBaseline(t) && t.amount < 0).reduce((sum, t) => sum - t.amount, 0));
    add('Estimates', transactions.filter(isSyntheticBaseline).reduce((sum, t) => sum + t.amount, 0));
    result.notes.push('Net spending = posted purchases − refunds + estimates. A negative total means credits exceeded charges.');
  }
  add('Contributing entries', result.rows.length, 'number');
  const estimateNotes = [...new Set(transactions.filter(isSyntheticBaseline).map((t) => t.note).filter((note): note is string => !!note))];
  result.notes.push(...estimateNotes);
  if (estimateNotes.length) result.actions.push({ label: 'Manage estimates and import history', href: '/settings' });
  if (query.statistic === 'monthly') { const count = query.months?.length ?? new Set(transactions.map((t) => t.date.slice(0, 7))).size; add('Months in average', count, 'number'); add('Monthly average', count ? total / count : null); }
  if (query.statistic === 'average') { const count = transactions.filter((t) => metric === 'income' ? isIncome(t) : t.amount > 0 && !isSyntheticBaseline(t)).length; add('Count used for average', count, 'number'); add('Average', count ? total / count : null); }
  if (metric === 'income') { add('Months paid', new Set(transactions.map((t) => t.date.slice(0, 7))).size, 'number'); }
  if (query.statistic === 'daily' && query.months?.length === 1) {
    const daily = dailySpending({ ...state, transactions: state.transactions.filter((t) => !query.rent || !isHousingTransaction(t)) }, query.months[0]);
    add('Days elapsed', daily.throughDay, 'number'); add('Days in month', daily.daysInMonth, 'number'); add('Average per elapsed day', daily.avgPerDay); add('Projected month total', daily.projected);
    result.notes.push('Daily average = net spending through the reporting day ÷ elapsed calendar days. Projection = fixed housing and estimates + (other net spending ÷ elapsed days × days in month). Future days have no recorded spending value.');
  }
  if (query.statistic === 'share') {
    const denominator = state.transactions.filter((t) => inPeriod(t, { ...query, weekday: undefined }) && (!query.rent || !isHousingTransaction(t)) && (query.weekday === undefined || !isSyntheticBaseline(t)) && (!query.denominatorSource || incomeSourceLabel(t.merchantName, t.name) === incomeSourceLabel(null, query.denominatorSource)) && (metric === 'income' ? isIncome(t) : isSpend(t))).reduce((sum, t) => sum + (metric === 'income' ? -t.amount : t.amount), 0);
    add('Total before category / source filter', denominator); add('Share of total', denominator > 0 ? total / denominator * 100 : null, 'percent');
  }
  if (query.priorMonths || query.priorFrom || query.priorTo) {
    const prior = resolveDetail(full, { ...query, months: query.priorMonths, from: query.priorFrom, to: query.priorTo, priorMonths: undefined, priorFrom: undefined, priorTo: undefined, statistic: undefined });
    const priorAvailable = prior.rows.length > 0 || state.transactions.some((t) => inPeriod(t, { ...query, months: query.priorMonths, from: query.priorFrom, to: query.priorTo }) && (metric !== 'income' || isIncome(t)));
    const previousTotal = !priorAvailable ? null : prior.summary.find((s) => s.label === (metric === 'net' ? 'Income − spending' : result.title))?.value ?? null;
    const previous = query.priorAverage && query.priorMonths?.length ? previousTotal == null ? null : previousTotal / query.priorMonths.length : previousTotal;
    const compared = query.statistic === 'monthly' && query.months?.length ? total / query.months.length : total;
    add(query.priorAverage ? 'Prior monthly average' : 'Previous period', previous); add('Change', previous == null ? null : compared - previous); add('Change (%)', previous ? (compared - previous) / Math.abs(previous) * 100 : null, 'percent');
    result.notes.push(`Comparison: ${prior.scope[0]}. Percentage change is unavailable when the prior total is zero.`);
    result.actions.push({ label: 'Inspect comparison period', href: detailHref({ ...query, months: query.priorMonths, from: query.priorFrom, to: query.priorTo, priorMonths: undefined, priorFrom: undefined, priorTo: undefined, statistic: undefined }) });
  }
  const currencies = new Set(transactions.map((t) => t.currency));
  if (currencies.size > 1) { result.summary = []; result.columns = result.columns.map((c) => ({ ...c, total: false })); result.notes.push('Multiple currencies. No combined total or currency conversion is available. Currency is shown for each entry.'); }
  else if (currencies.size === 1) result.currency = [...currencies][0];
  if (query.from && query.from > todayKey() && !result.rows.length) { result.summary = result.summary.map((item) => ({ ...item, value: item.format === 'number' ? item.value : null })); result.notes.push('This date is in the future. No recorded value is available yet.'); }
  if (!result.rows.length) result.notes.push('No contributing entries match this selection. The total is zero; no records are hidden by table pagination.');
  return result;
}
