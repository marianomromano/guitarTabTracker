import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/password";
import { accountUserId, normalizeEmail } from "@/lib/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmail(value: FormDataEntryValue | null) {
  const email = normalizeEmail(String(value ?? ""));
  if (!EMAIL_RE.test(email)) return null;
  return email;
}

export function parsePassword(value: FormDataEntryValue | null) {
  const password = String(value ?? "");
  if (password.length < 8) return null;
  return password;
}

export function findUserByEmail(email: string) {
  const db = getDb();
  return db.select().from(users).where(eq(users.email, email)).get() ?? null;
}

export function createUser(email: string, password: string) {
  const db = getDb();
  const user = {
    id: accountUserId(email),
    email,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  db.insert(users).values(user).run();
  return { userId: user.id, email: user.email };
}

export function authenticateUser(email: string, password: string) {
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  return { userId: user.id, email: user.email };
}
