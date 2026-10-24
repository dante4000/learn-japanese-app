"use client";

import { useRef, useState, type ReactNode } from "react";
import { useLoadingStatus } from "./LoadingFeedback";
import { useSavedRefresh } from "./useSavedRefresh";
import type { PlanKind, PlanRecord } from "@/lib/planning";

export function usePlanRecords<T extends PlanRecord>(kind: PlanKind, initial: T[]) {
  const [records, setRecords] = useState(initial);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const { savedMessage, refreshAfterSave, clearSavedFeedback } = useSavedRefresh();
  useLoadingStatus(busy, "Saving your plan…");
  async function mutate(record: T, action: "save" | "delete") {
    if (inFlight.current) return false;
    inFlight.current = true;
    setBusy(true); setError(null); clearSavedFeedback();
    try {
      const response = await fetch("/api/planning", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, action, record, id: record.id, revision: record.revision }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Could not save. Try again.");
      setRecords((previous) => action === "delete" ? previous.filter((r) => r.id !== record.id) : [...previous.filter((r) => r.id !== record.id), data.record as T]);
      refreshAfterSave();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save. Try again.");
      return false;
    } finally { inFlight.current = false; setBusy(false); }
  }
  return { records, busy, error, savedMessage, save: (record: T) => mutate(record, "save"), remove: (record: T) => mutate(record, "delete") };
}

export function PlanFeedback({ error, savedMessage }: { error: string | null; savedMessage: string | null }) {
  return <>{error && <p role="alert" className="mb-4 rounded-xl border border-coral/30 bg-coral/5 p-3 text-sm text-coral">{error}</p>}{savedMessage && <p role="status" className="mb-4 text-sm text-muted">{savedMessage}</p>}</>;
}
export function PlanField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex min-w-0 flex-col gap-1.5 text-sm text-cream-dim"><span>{label}</span>{children}</label>;
}
export function PlanProgress({ value, label, warning = false }: { value: number; label: string; warning?: boolean }) {
  return <progress aria-label={label} className={`plan-progress ${warning ? "plan-progress-warning" : ""}`} max={100} value={Math.max(0, Math.min(100, value))} />;
}
export function DeletePlan({ name, disabled, onDelete }: { name: string; disabled: boolean; onDelete: () => Promise<boolean> }) {
  const [confirm, setConfirm] = useState(false);
  return confirm ? <div className="flex flex-wrap items-center gap-2 text-sm"><span>Delete {name}?</span><button type="button" disabled={disabled} className="plan-button text-coral" onClick={async () => { if (await onDelete()) setConfirm(false); }}>Delete</button><button type="button" disabled={disabled} className="plan-button" onClick={() => setConfirm(false)}>Keep</button></div> : <button type="button" disabled={disabled} className="plan-button text-muted" onClick={() => setConfirm(true)}>Delete<span className="sr-only"> {name}</span></button>;
}
