import { loadStateCached } from "@/lib/store";
import { plaidConfigured } from "@/lib/providers/plaid";
import { SectionCard, PageHeading } from "@/components/ui";
import { ConnectionsList } from "@/components/ConnectionsList";
import { PlaidLinkButton } from "@/components/PlaidLinkButton";
import { CsvImport } from "@/components/CsvImport";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const state = await loadStateCached();
  const plaidReady = plaidConfigured();

  return (
    <div>
      <PageHeading title="Settings" subtitle="Connections, imports, and security." />

      <SectionCard title="Connected accounts" delay={0} className="mb-4">
        <ConnectionsList items={state.items} />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Connect a bank" delay={60}>
          <p className="mb-4 -mt-2 text-xs text-muted">
            Securely link Chase, Amex, and more through Plaid. Your bank login
            happens inside Plaid — this app only receives a read-only token.
          </p>
          {plaidReady ? (
            <PlaidLinkButton />
          ) : (
            <div className="rounded-xl border border-dashed hairline bg-surface p-4 text-sm text-muted">
              Plaid isn’t configured yet. Add{" "}
              <code className="text-slate-soft">PLAID_CLIENT_ID</code> and{" "}
              <code className="text-slate-soft">PLAID_SECRET</code> in your
              environment, then redeploy. Until then, use CSV import →
            </div>
          )}
        </SectionCard>

        <SectionCard title="Import a CSV" delay={100}>
          <p className="mb-4 -mt-2 text-xs text-muted">
            Export a statement from Chase or Amex and drop it here. Works with no
            approvals — a permanent backup to automatic sync.
          </p>
          <CsvImport accounts={state.accounts} />
        </SectionCard>
      </div>

      <SectionCard title="Security" delay={140} className="mt-4">
        <ul className="space-y-2.5 text-sm text-cream-dim">
          <li className="flex gap-2.5">
            <span className="text-blue">✓</span>
            Single-user access, protected by your passphrase with login
            rate-limiting.
          </li>
          <li className="flex gap-2.5">
            <span className="text-blue">✓</span>
            All data is AES-256-GCM encrypted at rest; the blob holds only
            ciphertext.
          </li>
          <li className="flex gap-2.5">
            <span className="text-blue">✓</span>
            Plaid access tokens are encrypted and never sent to the browser.
          </li>
          <li className="flex gap-2.5">
            <span className="text-blue">✓</span>
            Session cookie is HTTP-only, signed, and SameSite-strict over HTTPS.
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
