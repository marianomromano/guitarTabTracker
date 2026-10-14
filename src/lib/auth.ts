import { cache } from "react";
import { redirect } from "next/navigation";
import { ensureDemoCookie, readDemoUserId } from "@/lib/demo";
import { readSessionCookie } from "@/lib/session";

export type Session = {
  userId: string | null;
  email: string | null;
  isSignedIn: boolean;
  isDemo: boolean;
};

export const getSession = cache(async (): Promise<Session> => {
  const signedIn = await readSessionCookie();
  if (signedIn) {
    return {
      userId: signedIn.userId,
      email: signedIn.email,
      isSignedIn: true,
      isDemo: false,
    };
  }

  const demoUserId = await readDemoUserId();
  if (demoUserId) {
    return {
      userId: demoUserId,
      email: null,
      isSignedIn: false,
      isDemo: true,
    };
  }

  return {
    userId: null,
    email: null,
    isSignedIn: false,
    isDemo: false,
  };
});

export async function requireUserId() {
  const session = await getSession();
  if (!session.userId) {
    redirect("/");
  }
  return session.userId;
}

export async function ensureUserId() {
  const session = await getSession();
  if (session.userId) return session.userId;
  return ensureDemoCookie();
}
