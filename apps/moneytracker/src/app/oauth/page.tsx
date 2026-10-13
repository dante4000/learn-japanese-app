"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SCRIPT_SRC = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Plaid) return resolve();
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    const timeout = setTimeout(() => reject(new Error("Plaid did not load. Try again.")), 10_000);
    s.onload = () => {
      clearTimeout(timeout);
      if (window.Plaid) resolve();
      else reject(new Error("Failed to load Plaid"));
    };
    s.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Failed to load Plaid"));
    };
    document.body.appendChild(s);
  });
}

// Plaid OAuth redirect landing (for banks like Chase). We resume the original
// Link session using the stored link_token and the full redirect URL.
export default function OAuthReturnPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Resuming your bank connection…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem("plaid_link_token");
        if (!token) {
          setMsg("This link expired. Please start again from Settings.");
          setFailed(true);
          return;
        }
        await loadScript();
        if (cancelled) return;
        const handler = window.Plaid!.create({
          token,
          // @ts-expect-error receivedRedirectUri is a valid Plaid option
          receivedRedirectUri: window.location.href,
          onSuccess: async (publicToken: string) => {
            setMsg("Linking your accounts…");
            try {
              const res = await fetch("/api/plaid/exchange", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ public_token: publicToken }),
              });
              if (!res.ok) {
                const data = await res.json().catch(() => null);
                setMsg(data?.error || "Could not link your bank. Please try again from Settings.");
                setFailed(true);
                return;
              }
            } catch {
              setMsg("Could not link your bank. Please try again from Settings.");
              setFailed(true);
              return;
            }
            try {
              localStorage.removeItem("plaid_link_token");
            } catch {
              // The bank is linked even if browser storage is unavailable.
            }
            router.replace("/");
            router.refresh();
          },
          onExit: () => router.replace("/settings"),
        });
        handler.open();
      } catch {
        setMsg("Could not resume. Please try again from Settings.");
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        {!failed && <div aria-hidden="true" className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-line border-t-blue motion-reduce:animate-none" />}
        <p role={failed ? "alert" : "status"} className="text-sm text-cream-dim">{msg}</p>
        <Link href="/settings" className="mt-5 inline-block rounded-xl border hairline px-4 py-2 text-sm text-blue">
          Back to Settings
        </Link>
      </div>
    </main>
  );
}
