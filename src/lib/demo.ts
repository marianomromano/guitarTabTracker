import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { tabs } from "@/db/schema";
import { isClerkConfigured } from "@/lib/auth-config";

export const DEMO_COOKIE = "tabshelf-demo-id";
const LOCAL_DEMO_VALUE = "local";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function demoUserIdFromCookie(value: string | undefined) {
  if (!value) return null;
  if (value === LOCAL_DEMO_VALUE) return "local-dev";
  if (UUID_RE.test(value)) return `demo:${value}`;
  return null;
}

export async function readDemoUserId() {
  const jar = await cookies();
  return demoUserIdFromCookie(jar.get(DEMO_COOKIE)?.value);
}

export async function ensureDemoCookie() {
  const jar = await cookies();
  const current = jar.get(DEMO_COOKIE)?.value;
  if (demoUserIdFromCookie(current)) {
    return demoUserIdFromCookie(current)!;
  }

  const value = isClerkConfigured() ? crypto.randomUUID() : LOCAL_DEMO_VALUE;
  jar.set(DEMO_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.VERCEL === "1",
  });
  return demoUserIdFromCookie(value)!;
}

export async function clearDemoCookie() {
  const jar = await cookies();
  jar.delete(DEMO_COOKIE);
}

export function claimDemoTabs(signedInUserId: string, demoUserId: string) {
  if (signedInUserId === demoUserId) return 0;

  const db = getDb();
  const demoTabs = db.select().from(tabs).where(eq(tabs.userId, demoUserId)).all();
  let claimed = 0;

  for (const tab of demoTabs) {
    const existing = db
      .select({ id: tabs.id })
      .from(tabs)
      .where(
        and(
          eq(tabs.userId, signedInUserId),
          eq(tabs.trackId, tab.trackId),
          eq(tabs.instrument, tab.instrument),
        ),
      )
      .get();

    if (existing) continue;

    db.insert(tabs)
      .values({
        id: crypto.randomUUID(),
        userId: signedInUserId,
        trackId: tab.trackId,
        instrument: tab.instrument,
        songsterrId: tab.songsterrId,
        songsterrUrl: tab.songsterrUrl,
        tabTex: tab.tabTex,
        tabFile: tab.tabFile,
        tabFilename: tab.tabFilename,
        soundsliceHash: tab.soundsliceHash,
        createdAt: tab.createdAt,
      })
      .run();
    claimed += 1;
  }

  if (demoTabs.length > 0) {
    db.delete(tabs).where(eq(tabs.userId, demoUserId)).run();
  }

  return claimed + demoTabs.length;
}
