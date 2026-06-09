// Display formatting helpers.

export function formatMoney(
  amount: number,
  currency = "USD",
  opts: { sign?: boolean; cents?: boolean } = {},
): string {
  const { sign = false, cents = true } = opts;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(Math.abs(amount));
  if (sign) return (amount < 0 ? "−" : "+") + formatted;
  return (amount < 0 ? "−" : "") + formatted;
}

/** Compact form for big headline numbers: 1234567 → $1.23M */
export function formatCompact(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(new Date(y, m - 1, 1));
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // yyyy-mm
}
