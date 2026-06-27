import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { loadStateCached } from "@/lib/store";
import {
  detectRecurringStreams,
  allRecurringStreams,
  isTransferStream,
} from "@/lib/analytics";

// TEMPORARY diagnostic — remove after debugging the recurring detector.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "massive").toLowerCase();
  const state = await loadStateCached();

  const norm = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\b\d{2,}\b/g, " ").replace(/\s+/g, " ").trim();

  const txns = state.transactions
    .filter((t) => `${t.merchantName ?? ""} ${t.name}`.toLowerCase().includes(q))
    .map((t) => ({
      date: t.date,
      amount: t.amount,
      name: t.name,
      merchantName: t.merchantName,
      normMerchant: norm(t.merchantName || t.name),
      accountId: t.accountId,
      categoryPrimary: t.categoryPrimary,
      userCategory: t.userCategory,
      pending: t.pending,
      hidden: t.hidden,
    }));

  const plaidStreams = state.recurring
    .filter((s) => `${s.merchantName ?? ""} ${s.description}`.toLowerCase().includes(q))
    .map((s) => ({
      merchantName: s.merchantName,
      description: s.description,
      normMerchant: norm(s.merchantName || s.description || ""),
      accountId: s.accountId,
      type: s.type,
      categoryPrimary: s.categoryPrimary,
      isActive: s.isActive,
      isTransfer: isTransferStream(s),
    }));

  const detected = detectRecurringStreams(state)
    .filter((s) => `${s.merchantName ?? ""} ${s.description}`.toLowerCase().includes(q))
    .map((s) => ({ merchantName: s.merchantName, frequency: s.frequency, type: s.type, accountId: s.accountId }));

  const inAll = allRecurringStreams(state)
    .filter((s) => `${s.merchantName ?? ""} ${s.description}`.toLowerCase().includes(q))
    .map((s) => ({ merchantName: s.merchantName, type: s.type, inferred: s.inferred ?? false, isTransfer: isTransferStream(s) }));

  return NextResponse.json({
    q,
    txnCount: txns.length,
    txns,
    plaidStreams,
    detectedByUs: detected,
    inAllRecurring: inAll,
    totalRecurring: state.recurring.length,
    totalDetected: detectRecurringStreams(state).length,
  });
}
