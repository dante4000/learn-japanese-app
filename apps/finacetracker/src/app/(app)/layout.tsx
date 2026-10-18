import { CurrencyPicker } from "@/components/CurrencyPicker";
import { CURRENCY_COOKIE, availableCurrencies, selectedCurrency } from "@/lib/currency";
import { DetailProvider } from "@/components/DetailPanel";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isAuthenticated } from "@/lib/auth";
import { loadStateCached } from "@/lib/store";
import { LEGACY_ACCOUNT_COOKIE, ACCOUNT_COOKIE } from "@/lib/account-filter";
import { AppShell } from "@/components/AppShell";
import { AccountOption } from "@/components/AccountPicker";

// Server-side auth boundary for the whole app. The cookie is cryptographically
// verified here (not just presence-checked), so no data renders without a valid
// session — defense-in-depth behind the optimistic proxy redirect.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) redirect("/login");

  // Build the global account-picker options. loadStateCached shares the blob
  // read with whichever page renders inside this layout.
  const state = await loadStateCached();
  const instById = new Map(state.items.map((i) => [i.id, i.institutionName]));
  const accountOptions: AccountOption[] = state.accounts.map((a) => ({
    id: a.id,
    name: a.name,
    mask: a.mask,
    institution: instById.get(a.itemId) ?? "Other",
  }));
  const raw = ((await cookies()).get(ACCOUNT_COOKIE)?.value ?? (await cookies()).get(LEGACY_ACCOUNT_COOKIE)?.value) ?? null;
  const selectedAccount = state.accounts.some((a) => a.id === raw) ? raw : null;

  const currency = state.accounts.find((a) => a.id === selectedAccount)?.currency ?? selectedCurrency(state, (await cookies()).get(CURRENCY_COOKIE)?.value);
  return (
    <AppShell accountOptions={accountOptions} selectedAccount={selectedAccount}>
      <DetailProvider account={selectedAccount} currency={currency}><CurrencyPicker currencies={availableCurrencies(state)} selected={currency} />{children}</DetailProvider>
    </AppShell>
  );
}
