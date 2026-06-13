import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { loadState } from "@/lib/store";
import { resolveCategoryKey } from "@/lib/categories";

// Download the full ledger as CSV — every transaction with its effective
// category, account, and user annotations. For backup or Excel analysis.

function csvField(v: string | number | boolean | null): string {
  if (v === null) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state = await loadState();
  const accountName = new Map(state.accounts.map((a) => [a.id, a.name]));
  const institution = new Map(state.items.map((i) => [i.id, i.institutionName]));
  const accountItem = new Map(state.accounts.map((a) => [a.id, a.itemId]));

  const header = [
    "date",
    "description",
    "merchant",
    "amount",
    "currency",
    "institution",
    "account",
    "category",
    "category_detailed",
    "pending",
    "hidden",
    "note",
    "source",
    "id",
  ].join(",");

  const rows = state.transactions.map((t) =>
    [
      t.date,
      csvField(t.name),
      csvField(t.merchantName),
      // Export with the everyday sign convention: negative = money out.
      (-t.amount).toFixed(2),
      t.currency,
      csvField(institution.get(accountItem.get(t.accountId) ?? "") ?? ""),
      csvField(accountName.get(t.accountId) ?? t.accountId),
      resolveCategoryKey(t),
      csvField(t.categoryDetailed),
      t.pending,
      t.hidden,
      csvField(t.note),
      t.source,
      t.id,
    ].join(","),
  );

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse([header, ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="moneytracker-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
