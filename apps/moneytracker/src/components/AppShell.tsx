"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { AccountPicker, AccountOption } from "./AccountPicker";

const NAV = [
  { href: "/", label: "Overview", icon: "M3 12l9-8 9 8M5 10v10h14V10" },
  { href: "/spending", label: "Spending", icon: "M21 12a9 9 0 11-9-9v9z M12 3a9 9 0 019 9" },
  { href: "/income", label: "Income", icon: "M12 19V5M5 12l7-7 7 7" },
  { href: "/analysis", label: "Analysis", icon: "M3 21h18M7 21V9m5 12V3m5 18v-7" },
  { href: "/transactions", label: "Activity", icon: "M3 6h18M3 12h18M3 18h12" },
  { href: "/accounts", label: "Accounts", icon: "M3 7h18v12H3zM3 7l2-3h14l2 3M8 13h2" },
  { href: "/cards", label: "Cards", icon: "M3 7h18v10H3zM3 10h18M7 14h3" },
  { href: "/recurring", label: "Recurring", icon: "M4 8a8 8 0 0114-5M20 16a8 8 0 01-14 5M17 3v5h-5M7 21v-5h5" },
  { href: "/settings", label: "Settings", icon: "M12 9a3 3 0 100 6 3 3 0 000-6zM3 12h2m14 0h2M12 3v2m0 14v2" },
];

// On phones the bottom bar shows the five everyday tabs; the rest live behind a
// "More" sheet so each target keeps a comfortable tap size instead of cramming
// nine into one row.
const PRIMARY_NAV = NAV.slice(0, 5);
const MORE_NAV = NAV.slice(5);
const MORE_ICON = "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z";

function Glyph({ d }: { d: string }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

export function AppShell({
  children,
  accountOptions,
  selectedAccount,
}: {
  children: React.ReactNode;
  accountOptions: AccountOption[];
  selectedAccount: string | null;
}) {
  const showPicker = accountOptions.length > 1;
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (messageTimer.current) clearTimeout(messageTimer.current); }, []);

  const moreDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = moreDialog.current;
    if (moreOpen && dialog && !dialog.open) dialog.showModal();
    if (!moreOpen && dialog?.open) dialog.close();
    if (!moreOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [moreOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const isMoreActive = MORE_NAV.some((item) => isActive(item.href));

  async function refresh() {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    let keepMessage = true;
    setSyncing(true);
    setMsg(null);
    try {
      const res = await fetch("/api/plaid/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) setMsg(data.error || "Sync failed");
      else {
        setMsg(`${data.errors?.length ? "Some banks could not sync. Check Settings." : "Synced."}${typeof data.warning === "string" ? ` ${data.warning}` : ""}`);
        keepMessage = Boolean(data.errors?.length || data.warning);
        startTransition(() => router.refresh());
      }
    } catch {
      setMsg("Sync failed");
    } finally {
      setSyncing(false);
      if (!keepMessage) messageTimer.current = setTimeout(() => setMsg(null), 2500);
    }
  }

  async function logout() {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    setMsg(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Sign out failed");
      router.replace("/login");
      router.refresh();
    } catch {
      setMsg("Could not sign out. Try again.");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3">Skip to content</a>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 overflow-y-auto flex-col justify-between border-r hairline px-5 py-7 lg:flex">
        <div>
          <Link href="/" className="mb-10 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue text-ink">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18v12H3zM3 7l3-4h12l3 4M16 13h.01"/></svg>
            </span>
            <span className="font-display text-xl tracking-tight text-cream">
              Vault
            </span>
          </Link>
          {showPicker && (
            <div className="mb-6">
              <AccountPicker options={accountOptions} selected={selectedAccount} />
            </div>
          )}
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-surface-2 text-cream"
                    : "text-muted hover:text-cream"
                }`}
              >
                <Glyph d={item.icon} />
                {item.label}
                {isActive(item.href) && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue" />
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={refresh}
            disabled={syncing}
            className="min-h-11 lg:min-h-0 flex items-center justify-center gap-2 rounded-xl border hairline bg-surface px-3 py-2.5 text-sm text-cream transition-colors hover:border-line-2 disabled:opacity-50"
          >
            <span className={syncing || pending ? "animate-spin motion-reduce:animate-none" : ""}>
              <Glyph d="M4 8a8 8 0 0114-5M20 16a8 8 0 01-14 5M17 3v5h-5M7 21v-5h5" />
            </span>
            {syncing ? "Syncing…" : "Sync now"}
          </button>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={logout}
              className="min-h-11 lg:min-h-0 rounded-xl px-3 py-2 text-xs text-faint transition-colors hover:text-coral"
            >
              Lock & sign out
            </button>
            <ThemeToggle />
          </div>
          <span role="status" aria-live="polite" className="text-center text-xs text-blue">{msg}</span>
        </div>
      </aside>

      {/* Main */}
      <main id="main-content" className="min-w-0 flex-1 px-3 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-4 lg:px-8 lg:pb-10 lg:pt-9">
        {/* Mobile top bar */}
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue text-ink">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18v12H3zM3 7l3-4h12l3 4"/></svg>
            </span>
            <span className="font-display text-lg text-cream">Vault</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={refresh}
              disabled={syncing}
              className="min-h-11 rounded-lg border hairline bg-surface px-3 py-2 text-xs text-cream disabled:opacity-50"
            >
              {syncing ? "Syncing…" : "Sync"}
            </button>
          </div>
        </div>
        {showPicker && (
          <div className="mb-6 lg:hidden">
            <AccountPicker options={accountOptions} selected={selectedAccount} />
          </div>
        )}
        <p role="status" aria-live="polite" className="mb-2 text-xs text-blue lg:hidden">{msg}</p>
        {children}
      </main>

      {/* Mobile "More" sheet — the overflow tabs */}
      <dialog
        ref={moreDialog}
        aria-label="More navigation"
        onCancel={() => setMoreOpen(false)}
        onClose={() => setMoreOpen(false)}
        onClick={(event) => { if (event.target === event.currentTarget) setMoreOpen(false); }}
        className="fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] overscroll-contain w-full max-w-none overflow-y-auto rounded-t-2xl border hairline bg-ink-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-cream backdrop:bg-black/60"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg">More</h2>
          <button onClick={() => setMoreOpen(false)} className="min-h-11 rounded-lg border hairline px-3 py-2">Close</button>
        </div>
        <nav aria-label="More navigation" className="grid grid-cols-2 gap-2">
          {MORE_NAV.map((item) => (
            <Link key={item.href} href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={() => setMoreOpen(false)}
              className={`flex items-center gap-3 rounded-xl border hairline px-4 py-3 text-sm ${isActive(item.href) ? "bg-surface-2 text-cream" : "bg-surface text-cream-dim"}`}>
              <Glyph d={item.icon} />{item.label}
            </Link>
          ))}
        </nav>
        <p role="status" className="mt-3 text-sm text-coral">{msg}</p>
        <button onClick={logout} className="min-h-11 lg:min-h-0 mt-3 w-full rounded-xl border hairline px-4 py-3 text-sm">Lock &amp; sign out</button>
      </dialog>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t hairline bg-ink-2/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        {PRIMARY_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            onClick={() => setMoreOpen(false)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[0.6rem] ${
              isActive(item.href) ? "text-blue" : "text-muted"
            }`}
          >
            <Glyph d={item.icon} />
            {item.label}
          </Link>
        ))}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          aria-label="More"
          className={`min-h-11 lg:min-h-0 flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[0.6rem] ${
            isMoreActive || moreOpen ? "text-blue" : "text-muted"
          }`}
        >
          <Glyph d={MORE_ICON} />
          More
        </button>
      </nav>
    </div>
  );
}
