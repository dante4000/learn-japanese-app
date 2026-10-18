"use client";

import Link from "@/components/AppLink";

export default function AppError({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-lg content-center gap-4 px-6 py-12">
      <h1 className="font-display text-3xl text-cream">Could not load your dashboard</h1>
      <p role="alert" className="text-sm text-muted">
        Your data could not be read. Try again. If this continues, check the storage connection and encryption key.
      </p>
      <div className="flex flex-wrap gap-3">
        <button onClick={retry} className="rounded-xl bg-blue px-4 py-3 font-semibold text-ink">Try again</button>
        <Link href="/login" className="rounded-xl border hairline px-4 py-3 text-cream">Return to login</Link>
      </div>
    </main>
  );
}
