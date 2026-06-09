"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SCRIPT_SRC = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Plaid) return resolve();
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Plaid"));
    document.body.appendChild(s);
  });
}

// Plaid OAuth redirect landing (for banks like Chase). We resume the original
// Link session using the stored link_token and the full redirect URL.
export default function OAuthReturnPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Resuming your bank connection…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem("plaid_link_token");
      if (!token) {
        setMsg("This link expired. Please start again from Settings.");
        return;
      }
      try {
        await loadScript();
        if (cancelled) return;
        const handler = window.Plaid!.create({
          token,
          // @ts-expect-error receivedRedirectUri is a valid Plaid option
          receivedRedirectUri: window.location.href,
          onSuccess: async (publicToken: string) => {
            setMsg("Linking your accounts…");
            await fetch("/api/plaid/exchange", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ public_token: publicToken }),
            });
            localStorage.removeItem("plaid_link_token");
            router.replace("/");
          },
          onExit: () => router.replace("/settings"),
        });
        handler.open();
      } catch {
        setMsg("Could not resume. Please try again from Settings.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-line border-t-emerald" />
        <p className="text-sm text-cream-dim">{msg}</p>
      </div>
    </main>
  );
}
