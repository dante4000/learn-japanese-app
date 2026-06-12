import { cookies } from "next/headers";
import { getIronSession, SessionOptions } from "iron-session";
import { sha256Hex, safeEqualHex } from "./crypto";

// Single-user auth. There are no accounts or usernames — just one password.
// On success we set an encrypted, signed iron-session cookie carrying a single
// boolean. The cookie is verified cryptographically on every request (presence
// alone is not trusted), and the password is only ever compared as a SHA-256
// hash against APP_PASSWORD_HASH so the plaintext never lives anywhere.

export interface SessionData {
  authenticated: boolean;
  loginAt?: number;
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
    cookieName: "mt_session",
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
    return session.authenticated === true;
  } catch {
    return false;
  }
}

/** Verify a submitted password against APP_PASSWORD_HASH (constant-time). */
export function verifyPassword(submitted: string): boolean {
  const expected = process.env.APP_PASSWORD_HASH;
  if (!expected) {
    throw new Error(
      "APP_PASSWORD_HASH is not set. Generate it from your chosen password — see .env.example.",
    );
  }
  return safeEqualHex(sha256Hex(submitted), expected.trim().toLowerCase());
}
