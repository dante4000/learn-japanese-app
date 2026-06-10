import Link from "next/link";
import { ReactNode } from "react";

export function PageHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-3xl tracking-tight text-cream md:text-4xl">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </header>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  accent?: "blue" | "coral" | "slate" | "cream";
  delay?: number;
}) {
  const color =
    accent === "blue"
      ? "text-blue"
      : accent === "coral"
        ? "text-coral"
        : accent === "slate"
          ? "text-slate"
          : "text-cream";
  return (
    <div
      className="card card-hover rise p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="label-eyebrow">{label}</div>
      <div className={`tnum mt-2 text-2xl ${color}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
  delay = 0,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <section
      className={`card rise p-5 md:p-6 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {(title || action) && (
        <header className="mb-5 flex items-center justify-between">
          {title && (
            <h2 className="font-display text-lg tracking-tight text-cream">
              {title}
            </h2>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function EmptyState() {
  return (
    <div className="card rise grid place-items-center px-6 py-20 text-center">
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border hairline bg-surface-2 text-slate">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18v12H3zM3 7l3-4h12l3 4M16 13h.01"/></svg>
      </span>
      <h2 className="font-display text-2xl text-cream">No accounts yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Connect a bank with Plaid, or import a CSV export from Chase or Amex to
        bring your money into view.
      </p>
      <Link
        href="/settings"
        className="mt-6 rounded-xl bg-blue px-5 py-3 font-semibold text-ink transition-opacity hover:opacity-90"
      >
        Connect an account
      </Link>
    </div>
  );
}
