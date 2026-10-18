"use client";

import { useState } from "react";
import { useLoadingStatus } from "./LoadingFeedback";
import { useSavedRefresh } from "./useSavedRefresh";

interface Preview { fingerprint: string; conflicts: string[]; conflictCount: number; newConnections: number; newTransactions: number; manualEntries: number; baselines: number; snapshots: number; createdAt: string }
export function BackupManager() {
  const [backup, setBackup] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { savedMessage, clearSavedFeedback, refreshAfterSave } = useSavedRefresh();
  useLoadingStatus(busy, "Checking or restoring backup…");
  async function run(action: "preview" | "restore") {
    setBusy(true); setError(null); clearSavedFeedback();
    try {
      const response = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ backup, action, fingerprint: preview?.fingerprint }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Backup request failed.");
      if (action === "preview") setPreview(data);
      else { setPreview(null); setBackup(""); refreshAfterSave(); }
    } catch (error) { setError(error instanceof Error ? error.message : "Backup request failed."); if (action === "restore") setPreview(null); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4 text-sm">
    <p className="text-muted">Encrypted backups include connection history, edits, manual entries, estimates, card settings, and snapshots. Restore requires this app’s data encryption key. Keep the key securely with your recovery records.</p>
    <a href="/api/backup" download className="detail-link inline-flex min-h-11 items-center">Download encrypted backup</a>
    <p className="text-muted">Restore adds missing records. It does not replace changed records. Preview shows conflicts before any write.</p>
    <label className="block text-cream">Backup file<input type="file" accept=".backup,application/octet-stream,application/json" disabled={busy} className="mt-2 block w-full min-w-0 text-sm" onChange={async (event) => {
      const file = event.target.files?.[0]; setPreview(null); setBackup(""); setError(null); clearSavedFeedback();
      if (!file) return;
      if (file.size > 3_000_000) { setError("Backup exceeds the 3 MB limit."); return; }
      try { setBackup(await file.text()); } catch { setError("Could not read this file."); }
    }} /></label>
    <button disabled={busy || !backup} className="min-h-11 rounded-xl border hairline px-4 disabled:opacity-50" onClick={() => run("preview")}>{busy ? "Working…" : "Preview restore"}</button>
    {preview && <section className="rounded-xl border hairline p-4" aria-label="Restore preview"><p>Backup created {preview.createdAt.slice(0, 10)}.</p><p>Add {preview.newConnections} connections and {preview.newTransactions} transactions. Result: {preview.manualEntries} manual entries, {preview.baselines} estimates, and {preview.snapshots} snapshots.</p>{preview.conflictCount > 0 ? <><p className="mt-3 text-coral">{preview.conflictCount} conflicts. Restore is blocked. Existing data will stay unchanged.</p><ul className="mt-2 max-h-64 overflow-auto break-words">{preview.conflicts.map((c, i) => <li key={i}>{c}</li>)}</ul></> : <button disabled={busy} className="mt-4 min-h-11 rounded-xl bg-blue px-4 font-semibold text-ink disabled:opacity-50" onClick={() => run("restore")}>Restore missing data</button>}</section>}
    {error && <p role="alert" className="break-words text-coral">{error}</p>}
    {savedMessage && <p role="status" className="text-muted">{savedMessage}</p>}
  </div>;
}
