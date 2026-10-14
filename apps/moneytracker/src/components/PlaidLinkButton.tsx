"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoadingStatus, useLoadingTransition } from "./LoadingFeedback";

import { exchangePlaidToken, loadPlaidScript, PLAID_LINK_TOKEN_KEY } from "@/lib/plaid-link";

export function PlaidLinkButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [, startRefresh] = useLoadingTransition("Updating view…");
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  useLoadingStatus(waiting, "Connecting bank…");
  const [msg, setMsg] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setWaiting(true);
    setMsg(null);
    try {
      const res = await fetch("/api/plaid/link-token", { method: "POST" });
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
            const linked = await exchangePlaidToken(publicToken);
            setMsg(`Connected ${linked.institutionName}.${linked.warning ? ` ${linked.warning}` : ""}`);
            startRefresh(() => router.refresh());
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
      <button
        onClick={connect}
        disabled={busy || disabled}
        className="min-h-11 lg:min-h-0 flex items-center gap-2 rounded-xl bg-blue px-5 py-3 font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>
        {busy ? "Working…" : "Connect a bank with Plaid"}
      </button>
      {msg && <p role="status" className="mt-2 text-xs text-cream-dim">{msg}</p>}
    </div>
  );
}
