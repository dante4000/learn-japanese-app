import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isAuthenticated } from "@/lib/auth";
import { loadStateCached } from "@/lib/store";
import { ACCOUNT_COOKIE } from "@/lib/account-filter";
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
  const raw = (await cookies()).get(ACCOUNT_COOKIE)?.value ?? null;
  const selectedAccount = state.accounts.some((a) => a.id === raw) ? raw : null;

  return (
    <AppShell accountOptions={accountOptions} selectedAccount={selectedAccount}>
      {children}
    </AppShell>
  );
}
