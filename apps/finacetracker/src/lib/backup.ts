import { PLAN_KINDS, validatePlan, type PlanRecord } from "./planning";
import { createHash } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { encrypt, decrypt } from "./crypto";
import { validateCardOverrides } from "./card-overrides";
import type { ItemBundle, MetaDoc } from "./types";

export interface BackupData { bundles: ItemBundle[]; meta: MetaDoc }
export interface BackupArchive extends BackupData { format: "finacetracker"; version: 1; createdAt: string }
const MAX_BYTES = 16 * 1024 * 1024;
const fail = () => { throw new Error("Invalid backup data. No changes were made."); };
const object = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === "object" && !Array.isArray(v));
const text = (v: unknown) => typeof v === "string" && v.length <= 20_000;
const number = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const optionalText = (v: unknown) => v == null || text(v);
const currency = (v: unknown) => typeof v === "string" && /^[A-Z]{3}$/.test(v);
const date = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
const month = (v: unknown) => typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
const id = (v: unknown) => typeof v === "string" && /^[\w-]{1,200}$/.test(v);
const list = (v: unknown): unknown[] => { if (!Array.isArray(v) || v.length > 100_000) fail(); return v as unknown[]; };
function safeKeys(value: unknown): void {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (["__proto__", "constructor", "prototype"].includes(key)) fail();
    safeKeys(child);
  }
}
function unique(values: unknown[], key: (v: unknown) => unknown): void {
  const keys = values.map(key);
  if (new Set(keys).size !== keys.length) fail();
}

/** Validate relationships and all fields used by calculations before any write. */
export function validateBackup(value: unknown): BackupArchive {
  if (!object(value) || value.format !== "finacetracker" || value.version !== 1 || !text(value.createdAt)) fail();
  const archive = value as unknown as BackupArchive;
  safeKeys(value);
  const bundles = list(archive.bundles);
  if (bundles.length > 100) fail();
  const accountIds = new Set<string>();
  const transactionIds = new Set<string>();
  for (const raw of bundles) {
    if (!object(raw) || !object(raw.item)) fail();
    const bundle = raw as unknown as ItemBundle;
    const item = bundle.item;
    if (!id(item.id) || !["plaid", "csv", "manual"].includes(item.provider) || !text(item.institutionName) || !text(item.accessTokenEnc) || !optionalText(item.cursor) || !["healthy", "error", "needs_reauth"].includes(item.status) || !optionalText(item.error) || !optionalText(item.lastSyncedAt) || !text(item.createdAt)) fail();
    if (item.provider === "plaid") { try { if (!decrypt(item.accessTokenEnc)) fail(); } catch { fail(); } }
    const owned = new Set<string>();
    for (const rawAccount of list(bundle.accounts)) {
      const a = rawAccount as ItemBundle["accounts"][number];
      if (!object(a) || !id(a.id) || a.itemId !== item.id || !text(a.name) || !currency(a.currency) || !["depository", "credit", "loan", "investment", "other"].includes(a.type) || !object(a.balances) || ![a.balances.current, a.balances.available, a.balances.limit].every((n) => n === null || number(n)) || !["plaid", "csv", "manual"].includes(a.source) || !optionalText(a.mask) || !optionalText(a.officialName) || !optionalText(a.subtype)) fail();
      if (a.availability != null && !["reported", "unavailable"].includes(a.availability)) fail();
      if (a.lastReportedBalances && ![a.lastReportedBalances.current, a.lastReportedBalances.available, a.lastReportedBalances.limit].every((n) => n === null || number(n))) fail();
      if (accountIds.has(a.id)) fail();
      accountIds.add(a.id); owned.add(a.id);
    }
    for (const rawTransaction of list(bundle.transactions)) {
      const t = rawTransaction as ItemBundle["transactions"][number];
      if (!object(t) || !text(t.id) || !t.id || !owned.has(t.accountId) || !number(t.amount) || !currency(t.currency) || !date(t.date) || !text(t.name) || !optionalText(t.merchantName) || !text(t.categoryPrimary) || !optionalText(t.categoryDetailed) || !optionalText(t.userCategory) || !optionalText(t.note) || typeof t.hidden !== "boolean" || typeof t.pending !== "boolean" || !["plaid", "csv", "manual"].includes(t.source)) fail();
      if (transactionIds.has(t.id)) fail();
      transactionIds.add(t.id);
    }
    for (const rawRecurring of list(bundle.recurring)) {
      const r = rawRecurring as ItemBundle["recurring"][number];
      if (!object(r) || !text(r.id) || !owned.has(r.accountId) || !text(r.description) || !text(r.categoryPrimary) || !number(r.averageAmount) || !number(r.lastAmount) || !date(r.firstDate) || !date(r.lastDate) || r.predictedNextDate != null && !date(r.predictedNextDate) || typeof r.isActive !== "boolean" || !["inflow", "outflow"].includes(r.type) || !["WEEKLY", "BIWEEKLY", "SEMI_MONTHLY", "MONTHLY", "ANNUALLY", "UNKNOWN"].includes(r.frequency)) fail();
    }
    unique(bundle.recurring, (r) => (r as { id: string }).id);
  }
  unique(bundles, (b) => (b as ItemBundle).item.id);
  const meta = archive.meta;
  if (!object(meta) || meta.version !== 1) fail();
  for (const raw of list(meta.manualEntries)) {
    const m = raw as MetaDoc["manualEntries"][number];
    if (!object(m) || !id(m.id) || !text(m.name) || !["asset", "liability"].includes(m.kind) || !number(m.value) || !date(m.asOf) || m.currency != null && !currency(m.currency)) fail();
  }
  for (const raw of list(meta.baselines ?? [])) {
    const b = raw as NonNullable<MetaDoc["baselines"]>[number];
    if (!object(b) || !id(b.id) || !text(b.name) || !number(b.amount) || b.amount < 0 || !text(b.category) || !month(b.startMonth) || b.endMonth != null && (!month(b.endMonth) || b.endMonth < b.startMonth) || b.currency != null && !currency(b.currency)) fail();
  }
  for (const raw of list(meta.snapshots)) {
    const s = raw as MetaDoc["snapshots"][number];
    if (!object(s) || !date(s.date) || ![s.totalAssets, s.totalLiabilities, s.netWorth].every(number) || s.currency != null && !currency(s.currency) || s.complete != null && typeof s.complete !== "boolean") fail();
  }
  unique(meta.manualEntries, (m) => (m as { id: string }).id);
  unique(meta.baselines ?? [], (b) => (b as { id: string }).id);
  unique(meta.snapshots, (s) => `${(s as { date: string }).date}:${(s as { currency?: string }).currency ?? "USD"}`);
  if (meta.biltConfig && (!object(meta.biltConfig) || !Number.isInteger(meta.biltConfig.statementDay) || meta.biltConfig.statementDay < 1 || meta.biltConfig.statementDay > 28 || meta.biltConfig.housingOverride != null && (!number(meta.biltConfig.housingOverride) || meta.biltConfig.housingOverride < 0))) fail();
  const support = meta.employerHousingSupport;
  if (support && (!object(support) || !text(support.source) || !number(support.amount) || support.amount < 0 || !month(support.startMonth) || support.endMonth != null && (!month(support.endMonth) || support.endMonth < support.startMonth))) fail();
  if (meta.cardStatuses && (!object(meta.cardStatuses) || Object.values(meta.cardStatuses).some((v) => !["active", "closed"].includes(v)))) fail();
  if (meta.cardOverrides) validateCardOverrides(meta.cardOverrides);
  for (const kind of PLAN_KINDS) {
    if (meta[kind] == null) continue;
    const records = list(meta[kind]);
    if (records.length > 500) fail();
    for (const record of records) { try { validatePlan(kind, record); } catch { fail(); } }
    unique(records, (r) => (r as { id: string }).id);
  }
  unique(meta.budgets ?? [], (b) => `${(b as { currency: string }).currency}:${(b as { category: string }).category}`);
  return archive;
}

export function encodeBackup(data: BackupData): string {
  const archive: BackupArchive = { format: "finacetracker", version: 1, createdAt: new Date().toISOString(), ...data };
  validateBackup(archive);
  return JSON.stringify({ format: "finacetracker-encrypted-backup", version: 1, ciphertext: encrypt(gzipSync(JSON.stringify(archive)).toString("base64")) });
}

export function decodeBackup(raw: string): BackupArchive {
  if (Buffer.byteLength(raw) > 3_000_000) throw new Error("Backup exceeds the 3 MB upload limit.");
  try {
    const envelope = JSON.parse(raw);
    if (envelope.format !== "finacetracker-encrypted-backup" || envelope.version !== 1 || !text(envelope.format) || typeof envelope.ciphertext !== "string") fail();
    const compressed = Buffer.from(decrypt(envelope.ciphertext), "base64");
    return validateBackup(JSON.parse(gunzipSync(compressed, { maxOutputLength: MAX_BYTES }).toString("utf8")));
  } catch { throw new Error("This backup is invalid or uses a different data key. No changes were made."); }
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (object(value)) return `{${Object.keys(value).sort().filter((k) => value[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}
export interface RestorePlan extends BackupData { conflicts: string[]; newConnections: number; newTransactions: number; fingerprint: string }

/** Add missing records only. A changed saved record requires explicit review. */
export function planRestore(current: BackupData, incoming: BackupData): RestorePlan {
  const conflicts: string[] = [];
  function merge<T>(saved: T[], restored: T[], key: (v: T) => string, label: string): T[] {
    const map = new Map(saved.map((v) => [key(v), v]));
    for (const value of restored) {
      const prior = map.get(key(value));
      if (prior !== undefined && canonical(prior) !== canonical(value)) conflicts.push(`${label}: ${key(value)}`);
      else if (prior === undefined) map.set(key(value), value);
    }
    return [...map.values()];
  }
  const bundles = [...current.bundles];
  let newConnections = 0, newTransactions = 0;
  for (const source of incoming.bundles) {
    const index = bundles.findIndex((b) => b.item.id === source.item.id);
    if (index < 0) {
      if (source.item.institutionId && bundles.some((b) => b.item.institutionId === source.item.institutionId)) conflicts.push(`Institution already linked: ${source.item.institutionName}`);
      bundles.push(source); newConnections++; newTransactions += source.transactions.length;
    } else {
      const prior = bundles[index];
      // Preserve the current access token, cursor, sync status, and timestamps.
      const transactions = merge(prior.transactions, source.transactions, (t) => t.id, "Changed transaction");
      newTransactions += transactions.length - prior.transactions.length;
      bundles[index] = { item: prior.item, accounts: merge(prior.accounts, source.accounts, (a) => a.id, "Changed account"), transactions, recurring: merge(prior.recurring, source.recurring, (r) => r.id, "Changed recurring record") };
    }
  }
  const meta: MetaDoc = { ...current.meta,
    manualEntries: merge(current.meta.manualEntries, incoming.meta.manualEntries, (m) => m.id, "Changed manual entry"),
    baselines: merge(current.meta.baselines ?? [], incoming.meta.baselines ?? [], (b) => b.id, "Changed estimate"),
    snapshots: merge(current.meta.snapshots, incoming.meta.snapshots, (s) => `${s.date}:${s.currency ?? "USD"}`, "Changed snapshot"),
  };
  for (const field of ["biltConfig", "employerHousingSupport", "cardStatuses", "cardOverrides"] as const) {
    const from = incoming.meta[field], to = current.meta[field];
    if (from == null) continue;
    if (to != null && canonical(from) !== canonical(to)) conflicts.push(`Changed settings: ${field}`);
    else Object.assign(meta, { [field]: from });
  }
  for (const kind of PLAN_KINDS) {
    if (!current.meta[kind] && !incoming.meta[kind]) continue;
    Object.assign(meta, { [kind]: merge<PlanRecord>(current.meta[kind] ?? [], incoming.meta[kind] ?? [], (r) => r.id, `Changed ${kind}`) });
  }
  const budgetKeys = (meta.budgets ?? []).map((b) => `${b.currency}:${b.category}`);
  if (new Set(budgetKeys).size !== budgetKeys.length) conflicts.push("Duplicate category budgets");
  // Global account/transaction identities must stay unique after merging.
  for (const field of ["accounts", "transactions"] as const) {
    const ids = bundles.flatMap((b) => b[field].map((r) => r.id));
    if (ids.length !== new Set(ids).size) conflicts.push(`Duplicate ${field} across connections`);
  }
  return { bundles, meta, conflicts, newConnections, newTransactions, fingerprint: createHash("sha256").update(canonical({ current, incoming })).digest("hex") };
}
