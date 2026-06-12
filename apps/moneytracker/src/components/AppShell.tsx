"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { AccountPicker, AccountOption } from "./AccountPicker";

const NAV = [
  { href: "/", label: "Overview", icon: "M3 12l9-8 9 8M5 10v10h14V10" },
  { href: "/spending", label: "Spending", icon: "M21 12a9 9 0 11-9-9v9z M12 3a9 9 0 019 9" },
  { href: "/analysis", label: "Analysis", icon: "M3 21h18M7 21V9m5 12V3m5 18v-7" },
  { href: "/transactions", label: "Activity", icon: "M3 6h18M3 12h18M3 18h12" },
  { href: "/accounts", label: "Accounts", icon: "M3 7h18v12H3zM3 7l2-3h14l2 3M8 13h2" },
  { href: "/recurring", label: "Recurring", icon: "M4 8a8 8 0 0114-5M20 16a8 8 0 01-14 5M17 3v5h-5M7 21v-5h5" },
  { href: "/settings", label: "Settings", icon: "M12 9a3 3 0 100 6 3 3 0 000-6zM3 12h2m14 0h2M12 3v2m0 14v2" },
];

function Glyph({ d }: { d: string }) {
  return (
    <svg
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

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  async function refresh() {
    setSyncing(true);
    setMsg(null);
    try {
      const res = await fetch("/api/plaid/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) setMsg(data.error || "Sync failed");
      else {
        setMsg("Synced");
        startTransition(() => router.refresh());
      }
    } catch {
      setMsg("Sync failed");
    } finally {
      setSyncing(false);
      setTimeout(() => setMsg(null), 2500);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col justify-between border-r hairline px-5 py-7 md:flex">
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
            className="flex items-center justify-center gap-2 rounded-xl border hairline bg-surface px-3 py-2.5 text-sm text-cream transition-colors hover:border-line-2 disabled:opacity-50"
          >
            <span className={syncing || pending ? "animate-spin" : ""}>
              <Glyph d="M4 8a8 8 0 0114-5M20 16a8 8 0 01-14 5M17 3v5h-5M7 21v-5h5" />
            </span>
            {syncing ? "Syncing…" : "Sync now"}
          </button>
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={logout}
              className="rounded-xl px-3 py-2 text-xs text-faint transition-colors hover:text-coral"
            >
              Lock & sign out
            </button>
            <ThemeToggle />
          </div>
          {msg && <span className="text-center text-xs text-blue">{msg}</span>}
        </div>
      </aside>

      {/* Main */}
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-10 md:pt-9">
        {/* Mobile top bar */}
        <div className="mb-6 flex items-center justify-between md:hidden">
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
              className="rounded-lg border hairline bg-surface px-3 py-2 text-xs text-cream disabled:opacity-50"
            >
              {syncing ? "Syncing…" : "Sync"}
            </button>
          </div>
        </div>
        {showPicker && (
          <div className="mb-6 md:hidden">
            <AccountPicker options={accountOptions} selected={selectedAccount} />
          </div>
        )}
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t hairline bg-ink-2/95 px-2 py-2 backdrop-blur md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[0.6rem] ${
              isActive(item.href) ? "text-blue" : "text-muted"
            }`}
          >
            <Glyph d={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
