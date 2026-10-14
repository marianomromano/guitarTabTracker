import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const SESSION_COOKIE = "tabshelf_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type SessionRecord = {
  userId: string;
  email: string;
};

function sessionSecret() {
  return process.env.AUTH_SECRET || process.env.CLERK_SECRET_KEY || "tabshelf-dev-auth";
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function sameValue(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function accountUserId(email: string) {
  return `acct:${normalizeEmail(email)}`;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function sessionCookieValue(session: SessionRecord) {
  const payload = Buffer.from(
    JSON.stringify({
      userId: session.userId,
      email: session.email,
      exp: Date.now() + MAX_AGE_SECONDS * 1000,
    }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
  secure: process.env.VERCEL === "1",
};

export function applySessionCookie(response: NextResponse, session: SessionRecord) {
  response.cookies.set(SESSION_COOKIE, sessionCookieValue(session), cookieOptions);
}

export async function readSessionCookie(): Promise<SessionRecord | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!sameValue(sign(payload), signature)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      userId?: string;
      email?: string;
      exp?: number;
    };
    if (!data.userId || !data.email || typeof data.exp !== "number" || data.exp < Date.now()) {
      return null;
    }
    return { userId: data.userId, email: data.email };
  } catch {
    return null;
  }
}
