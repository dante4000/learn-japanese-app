"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="w-full max-w-sm rise">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-emerald text-ink shadow-lg shadow-emerald/20">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18v12H3zM3 7l3-4h12l3 4M16 13h.01"/></svg>
          </span>
          <h1 className="font-display text-4xl tracking-tight text-cream">
            Vault
          </h1>
          <p className="mt-2 text-sm text-muted">
            Your private money dashboard. One key opens it.
          </p>
        </div>

        <form onSubmit={submit} className="card p-6">
          <label className="label-eyebrow mb-2 block">Passphrase</label>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="tnum w-full rounded-xl border hairline bg-ink px-4 py-3 text-cream outline-none transition-colors placeholder:text-faint focus:border-emerald"
          />
          {error && (
            <p className="mt-3 text-sm text-coral" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="mt-5 w-full rounded-xl bg-emerald py-3 font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Unlocking…" : "Unlock"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-faint">
          Encrypted at rest · Single user · No data leaves your accounts
        </p>
      </div>
    </main>
  );
}
