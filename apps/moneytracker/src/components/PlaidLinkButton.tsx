"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Plaid?: {
      create: (opts: {
        token: string;
        onSuccess: (publicToken: string) => void;
        onExit: () => void;
      }) => { open: () => void };
    };
  }
}

const SCRIPT_SRC = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Plaid) return resolve();
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Plaid"));
    document.body.appendChild(s);
  });
}

export function PlaidLinkButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function connect() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/plaid/link-token", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "Could not start Plaid");
        setBusy(false);
        return;
      }
      await loadScript();
      // Persist the token so an OAuth redirect (e.g. Chase) can resume on /oauth.
      try {
        localStorage.setItem("plaid_link_token", data.link_token);
      } catch {}
      const handler = window.Plaid!.create({
        token: data.link_token,
        onSuccess: async (publicToken: string) => {
          setMsg("Linking…");
          const ex = await fetch("/api/plaid/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_token: publicToken }),
          });
          const exData = await ex.json();
          setMsg(ex.ok ? `Connected ${exData.institutionName}` : exData.error);
          setBusy(false);
          router.refresh();
        },
        onExit: () => setBusy(false),
      });
      handler.open();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Plaid error");
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={connect}
        disabled={busy || disabled}
        className="flex items-center gap-2 rounded-xl bg-blue px-5 py-3 font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>
        {busy ? "Working…" : "Connect a bank with Plaid"}
      </button>
      {msg && <p className="mt-2 text-xs text-cream-dim">{msg}</p>}
    </div>
  );
}
