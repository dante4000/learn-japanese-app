import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

// Only a cryptographically valid session skips the form. The proxy must not do
// this redirect from cookie presence alone — an invalid cookie would ping-pong
// between / and /login forever.
export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/");
  return <LoginForm />;
}
