import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

// Server-side auth boundary for the whole app. The cookie is cryptographically
// verified here (not just presence-checked), so no data renders without a valid
// session — defense-in-depth behind the optimistic proxy redirect.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
