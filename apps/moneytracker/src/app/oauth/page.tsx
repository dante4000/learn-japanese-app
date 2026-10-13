"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { exchangePlaidToken, loadPlaidScript, PLAID_LINK_TOKEN_KEY, type PlaidLinkHandler } from "@/lib/plaid-link";

// Plaid OAuth redirect landing (for banks like Chase). We resume the original
// Link session using the stored link_token and the full redirect URL.
export default function OAuthReturnPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("Resuming your bank connection…");
  const [failed, setFailed] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let linkSaved = false;
    let handler: PlaidLinkHandler | undefined;
    (async () => {
      try {
        const token = localStorage.getItem(PLAID_LINK_TOKEN_KEY);
        if (!token) {
          setMsg("This link expired. Please start again from Settings.");
          setFailed(true);
          return;
        }
        await loadPlaidScript();
        if (cancelled) return;
        handler = window.Plaid!.create({
          token,
          receivedRedirectUri: window.location.href,
          onSuccess: async (publicToken: string) => {
            if (cancelled) return;
            setMsg("Linking your accounts…");
            try {
              const linked = await exchangePlaidToken(publicToken);
              if (cancelled) return;
              linkSaved = true;
              if (linked.warning) {
                setMsg(`Connected ${linked.institutionName}. ${linked.warning}`);
                setCompleted(true);
                return;
              }
              router.replace("/");
              router.refresh();
            } catch (error) {
              if (cancelled) return;
              setMsg(error instanceof Error ? error.message : "Could not link your bank. Try again from Settings.");
              setFailed(true);
            }
          },
          onExit: () => { if (!cancelled && !linkSaved) router.replace("/settings"); },
        });
        handler.open();
      } catch {
        if (cancelled) return;
        setMsg("Could not resume. Please try again from Settings.");
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      handler?.destroy?.();
    };
  }, [router]);

  return (
    <main className="grid min-h-dvh place-items-center px-5 text-center">
      <div>
        {!failed && !completed && <div aria-hidden="true" className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-line border-t-blue motion-reduce:animate-none" />}
        <p role={failed ? "alert" : "status"} className="text-sm text-cream-dim">{msg}</p>
        <Link href={completed ? "/" : "/settings"} className="mt-5 inline-block rounded-xl border hairline px-4 py-2 text-sm text-blue">
          {completed ? "Continue to dashboard" : "Back to Settings"}
        </Link>
      </div>
    </main>
  );
}
