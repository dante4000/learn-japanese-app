"use client";

import { useState } from "react";
import { useSavedRefresh } from "./useSavedRefresh";
import { useLoadingStatus } from "./LoadingFeedback";

import { exchangePlaidToken, completePlaidUpdate, loadPlaidScript, PLAID_LINK_TOKEN_KEY, PLAID_UPDATE_ITEM_KEY } from "@/lib/plaid-link";

export function PlaidLinkButton({ disabled, itemId }: { disabled?: boolean; itemId?: string }) {
  const { savedMessage, refreshAfterSave, clearSavedFeedback } = useSavedRefresh();
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  useLoadingStatus(waiting, "Connecting bank…");
  const [msg, setMsg] = useState<string | null>(null);

  async function connect() {
    clearSavedFeedback();
    setBusy(true);
    setWaiting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/plaid/link-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(itemId ? { itemId } : {}) });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Could not start Plaid");
        setBusy(false);
        return;
      }
      await loadPlaidScript();
      // Persist the token so an OAuth redirect (e.g. Chase) can resume on /oauth.
      try {
        localStorage.setItem(PLAID_LINK_TOKEN_KEY, data.link_token);
        if (itemId) localStorage.setItem(PLAID_UPDATE_ITEM_KEY, itemId);
        else localStorage.removeItem(PLAID_UPDATE_ITEM_KEY);
      } catch {}
      const handler = window.Plaid!.create({
        token: data.link_token,
        onSuccess: async (publicToken: string) => {
          setWaiting(true);
          // Plaid invokes this later, outside connect()'s try/catch — guard it
          // on its own so a failed exchange or non-JSON response can't leave the
          // button stuck on "Working…".
          setMsg("Linking…");
          try {
            const linked = await (itemId ? completePlaidUpdate(itemId) : exchangePlaidToken(publicToken));
            setMsg(`Connected ${linked.institutionName}.${linked.warning ? ` ${linked.warning}` : ""}`);
            refreshAfterSave();
          } catch (error) {
            setMsg(error instanceof Error ? error.message : "Could not link your bank.");
          } finally {
            setBusy(false);
            setWaiting(false);
          }
        },
        onExit: () => { setBusy(false); setWaiting(false); },
      });
      handler.open();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Plaid error");
      setBusy(false);
    } finally {
      // Plaid owns its interactive dialog once open.
      setWaiting(false);
    }
  }

  return (
    <div>
      {savedMessage && <p role="status" className="mb-3 text-sm text-muted">{savedMessage}</p>}
      <button
        onClick={connect}
        disabled={busy || disabled}
        className="min-h-11 lg:min-h-0 flex items-center gap-2 rounded-xl bg-blue px-5 py-3 font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>
        {busy ? "Working…" : itemId ? "Reconnect" : "Connect a bank with Plaid"}
      </button>
      {msg && <p role="status" className="mt-2 text-xs text-cream-dim">{msg}</p>}
    </div>
  );
}
