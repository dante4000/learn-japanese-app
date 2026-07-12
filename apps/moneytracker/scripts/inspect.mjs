import { list } from "@vercel/blob";
import { createDecipheriv } from "node:crypto";
import { readFileSync } from "node:fs";

// load .env.verify
const env = {};
for (const line of readFileSync(new URL("../.env.verify", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
  if (m) env[m[1]] = m[2];
}
const KEY = Buffer.from(env.ENCRYPTION_KEY, "hex");
process.env.BLOB_READ_WRITE_TOKEN = env.BLOB_READ_WRITE_TOKEN;

function decrypt(payload) {
  const [ivHex, tagHex, dataHex] = payload.split(":");
  const d = createDecipheriv("aes-256-gcm", KEY, Buffer.from(ivHex, "hex"));
  d.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([d.update(Buffer.from(dataHex, "hex")), d.final()]).toString("utf8");
}

const PREFIX = "moneytracker/v2/";
const { blobs } = await list({ prefix: PREFIX });
const docs = {};
for (const b of blobs) {
  const name = b.pathname.slice(PREFIX.length, -".enc".length);
  const res = await fetch(`${b.url}?v=${Date.now()}`, { cache: "no-store" });
  docs[name] = JSON.parse(decrypt(await res.text()));
}

console.log("=== ITEMS / SYNC HEALTH ===");
for (const [name, doc] of Object.entries(docs)) {
  if (!name.startsWith("item__")) continue;
  const it = doc.item;
  console.log(
    `\n• ${it.institutionName} [${it.provider}] status=${it.status} err=${it.error ?? "none"}`,
  );
  console.log(`  lastSyncedAt=${it.lastSyncedAt}  cursor=${it.cursor ? "set" : "null"}`);
  console.log(`  accounts=${doc.accounts.length} txns=${doc.transactions.length} recurring=${doc.recurring.length}`);
  for (const a of doc.accounts) {
    console.log(`    - acct "${a.name}" id=${a.id} type=${a.type} bal=${a.balances?.current}`);
  }
}

console.log("\n=== SEARCH: service fee / monthly fee ===");
for (const [name, doc] of Object.entries(docs)) {
  if (!name.startsWith("item__")) continue;
  const acctName = new Map(doc.accounts.map((a) => [a.id, a.name]));
  const hits = doc.transactions.filter((t) =>
    /service fee|monthly fee|maintenance fee|account fee/i.test(
      `${t.name ?? ""} ${t.merchantName ?? ""} ${t.description ?? ""}`,
    ),
  );
  for (const t of hits) {
    console.log(
      `  [${acctName.get(t.accountId) ?? t.accountId}] ${t.date}  ${t.amount}  "${t.name ?? t.description}" cat=${t.category}/${t.userCategory ?? ""}`,
    );
  }
}

console.log("\n=== ACCOUNTS NAMED LIKE 'joint' / 'bon' ===");
for (const [name, doc] of Object.entries(docs)) {
  if (!name.startsWith("item__")) continue;
  for (const a of doc.accounts) {
    if (/joint|bon|daniel/i.test(a.name)) {
      console.log(`  ${doc.item.institutionName} :: "${a.name}" (${doc.transactions.filter(t=>t.accountId===a.id).length} txns)`);
    }
  }
}

console.log("\n=== META snapshots (last 5) ===");
const meta = docs["meta"];
if (meta) {
  console.log(`manualEntries=${meta.manualEntries?.length} snapshots=${meta.snapshots?.length}`);
  for (const s of (meta.snapshots ?? []).slice(-5)) console.log("  ", JSON.stringify(s));
}
