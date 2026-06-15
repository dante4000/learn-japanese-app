"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Account } from "@/lib/types";

export function CsvImport({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
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
  const [msg, setMsg] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setCsv(await file.text());
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!csv) return;
    setBusy(true);
    setMsg(null);
    const body =
      mode === "existing"
        ? { mode, accountId, outflowSign, csv }
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
      setMsg(`Imported ${data.imported} transactions${data.skipped ? `, skipped ${data.skipped}` : ""}.`);
      setCsv("");
      setFileName("");
      router.refresh();
    } catch {
      setMsg("Import failed — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border hairline bg-surface px-3 py-2.5 text-sm text-cream outline-none placeholder:text-faint focus:border-blue";

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed hairline bg-surface px-4 py-4 text-sm transition-colors hover:border-line-2">
        <span className="text-cream-dim">
          {fileName || "Choose a .csv export from your bank"}
        </span>
        <span className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-cream">
          Browse
        </span>
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
      </label>

      {accounts.length > 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("existing")}
            className={`flex-1 rounded-xl border px-3 py-2 text-xs ${mode === "existing" ? "border-blue text-cream" : "hairline text-muted"}`}
          >
            Add to existing account
          </button>
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`flex-1 rounded-xl border px-3 py-2 text-xs ${mode === "new" ? "border-blue text-cream" : "hairline text-muted"}`}
          >
            Create new account
          </button>
        </div>
      )}

      {mode === "existing" ? (
        <select
          value={accountId}
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
        <div className="grid grid-cols-2 gap-2">
          <input
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
            placeholder="Institution (e.g. Chase)"
            className={field}
          />
          <input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Account name"
            className={field}
          />
          <select
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
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            inputMode="decimal"
            placeholder="Current balance"
            className={`${field} tnum`}
          />
        </div>
      )}

      <div>
        <label className="label-eyebrow mb-1.5 block">Amount convention</label>
        <select
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
        disabled={busy || !csv}
        className="w-full rounded-xl bg-slate py-2.5 text-sm font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {busy ? "Importing…" : "Import transactions"}
      </button>
      {msg && <p className="text-xs text-cream-dim">{msg}</p>}
    </form>
  );
}
