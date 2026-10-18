import { scryptSync } from "node:crypto";
import { cookies } from "next/headers";
import { getIronSession, SessionOptions } from "iron-session";
import { sha256Hex, safeEqualHex } from "./crypto";

// Authentication configuration changes revoke existing sessions.

export interface SessionData {
  authenticated: boolean;
  loginAt?: number;
  version?: string;
}

// 400 days — the maximum cookie lifetime browsers honor (Chrome caps Max-Age at
// 400 days). For a single-user personal app this means you effectively never
// have to log in again.
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 400;

export function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set and at least 32 characters. Generate with: openssl rand -base64 48",
    );
  }
  return {
    password,
    cookieName: "finacetracker_session",
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // "lax" (not "strict") so the cookie is still sent when you return to the
      // site from an external page — e.g. coming back from your bank's OAuth
      // flow — instead of being dropped and bouncing you to the login screen.
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions());
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getSession();
    return session.authenticated === true && session.version === sessionVersion();
  } catch {
    return false;
  }
}

/** Changing the password hash or explicit version revokes all prior sessions. */
export function sessionVersion(): string {
  return sha256Hex(`${process.env.APP_PASSWORD_HASH ?? ""}:${process.env.AUTH_SESSION_VERSION ?? "1"}`);
}

/** Verify a submitted password against APP_PASSWORD_HASH (constant-time). */
export function verifyPassword(submitted: string): boolean {
  const expected = process.env.APP_PASSWORD_HASH;
  if (!expected) {
    throw new Error(
      "APP_PASSWORD_HASH is not set. Generate it from your chosen password — see .env.example.",
    );
  }
  if (submitted.length > 1024) return false;
  const hash = expected.trim();
  if (hash.startsWith("scrypt$")) {
    const [, salt, digest] = hash.split("$");
    if (!/^[a-f0-9]{32}$/i.test(salt ?? "") || !/^[a-f0-9]{128}$/i.test(digest ?? "")) return false;
    return safeEqualHex(scryptSync(submitted, Buffer.from(salt, "hex"), 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex"), digest);
  }
  return safeEqualHex(sha256Hex(submitted), hash.toLowerCase());
}
