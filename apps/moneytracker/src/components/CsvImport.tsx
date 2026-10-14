"use client";

import { useLoadingStatus, useLoadingTransition } from "./LoadingFeedback";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Account } from "@/lib/types";

export function CsvImport({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [, startRefresh] = useLoadingTransition("Updating view…");
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState<"new" | "existing">(
    accounts.length ? "existing" : "new",
  );
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [institutionName, setInstitutionName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("depository");
  const [currentBalance, setCurrentBalance] = useState("");
  const [outflowSign, setOutflowSign] = useState<
    "negative_is_outflow" | "positive_is_outflow"
  >("negative_is_outflow");
  const [busy, setBusy] = useState(false);
  useLoadingStatus(busy, "Processing CSV…");
  const [msg, setMsg] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const selectedAccountId = accounts.some((a) => a.id === accountId)
    ? accountId
    : accounts[0]?.id ?? "";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsv("");
    setMsg(null);
    setBusy(true);
    try {
      setCsv(await file.text());
      setFileName(file.name);
    } catch {
      setFileName("");
      setMsg("Could not read this file. Select it again.");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!csv) return;
    if (mode === "new" && currentBalance.trim() && !Number.isFinite(Number(currentBalance))) {
      setMsg("Current balance must be a number.");
      return;
    }
    setBusy(true);
    setMsg(null);
    const body =
      mode === "existing"
        ? { mode, accountId: selectedAccountId, outflowSign, csv }
        : {
            mode,
            institutionName,
            accountName,
            accountType,
            currentBalance: currentBalance ? Number(currentBalance) : undefined,
            outflowSign,
            csv,
          };
    try {
      const res = await fetch("/api/import/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg(data?.error || "Import failed");
        return;
      }
      setMsg(`Imported ${data.imported} transactions${data.skipped ? `, skipped ${data.skipped}` : ""}.${typeof data.warning === "string" ? ` ${data.warning}` : ""}`);
      setCsv("");
      setFileName("");
      startRefresh(() => router.refresh());
    } catch {
      setMsg("Import failed — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "min-w-0 max-w-full w-full rounded-xl border hairline bg-surface px-3 py-2.5 text-base sm:text-sm text-cream outline-none placeholder:text-faint focus:border-blue";

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="relative flex cursor-pointer items-center gap-3 justify-between rounded-xl border border-dashed hairline bg-surface px-4 py-4 text-sm transition-colors hover:border-line-2 focus-within:outline-2 focus-within:outline-blue">
        <span className="min-w-0 flex-1 break-words text-cream-dim">
          {fileName || "Choose a .csv export from your bank"}
        </span>
        <span className="shrink-0 rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-cream">
          Browse
        </span>
        <input ref={fileInput} type="file" aria-label="Choose a CSV export from your bank" accept=".csv,text/csv" onChange={onFile} disabled={busy} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </label>

      {accounts.length > 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={mode === "existing"}
            onClick={() => setMode("existing")}
            className={`min-h-11 lg:min-h-0 flex-1 rounded-xl border px-3 py-2 text-xs ${mode === "existing" ? "border-blue text-cream" : "hairline text-muted"}`}
          >
            Add to existing account
          </button>
          <button
            type="button"
            aria-pressed={mode === "new"}
            onClick={() => setMode("new")}
            className={`min-h-11 lg:min-h-0 flex-1 rounded-xl border px-3 py-2 text-xs ${mode === "new" ? "border-blue text-cream" : "hairline text-muted"}`}
          >
            Create new account
          </button>
        </div>
      )}

      {mode === "existing" ? (
        <select
          aria-label="Import into account"
          value={selectedAccountId}
          onChange={(e) => setAccountId(e.target.value)}
          className={field}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            aria-label="Institution name"
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
            placeholder="Institution (e.g. Chase)"
            className={field}
          />
          <input
            aria-label="Account name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Account name"
            className={field}
          />
          <select
            aria-label="Account type"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className={field}
          >
            <option value="depository">Checking / Savings</option>
            <option value="credit">Credit card</option>
            <option value="loan">Loan</option>
            <option value="investment">Investment</option>
          </select>
          <input
            aria-label="Current balance"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            inputMode="decimal"
            placeholder="Current balance"
            className={`${field} tnum`}
          />
        </div>
      )}

      <div>
        <label htmlFor="csv-amount-convention" className="label-eyebrow mb-1.5 block">Amount convention</label>
        <select
          id="csv-amount-convention"
          value={outflowSign}
          onChange={(e) =>
            setOutflowSign(e.target.value as typeof outflowSign)
          }
          className={field}
        >
          <option value="negative_is_outflow">
            Negative = money out (Chase, Amex, most banks)
          </option>
          <option value="positive_is_outflow">
            Positive = money out (some card exports)
          </option>
        </select>
      </div>

      <button
        type="submit"
        disabled={busy || !csv || (mode === "existing" && !selectedAccountId)}
        className="min-h-11 lg:min-h-0 w-full rounded-xl bg-slate py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {busy ? "Importing…" : "Import transactions"}
      </button>
      {msg && <p role="status" className="text-xs text-cream-dim">{msg}</p>}
    </form>
  );
}
