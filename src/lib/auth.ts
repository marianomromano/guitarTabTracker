import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/auth-config";
import { readDemoUserId } from "@/lib/demo";

export { isClerkConfigured } from "@/lib/auth-config";

export type Session = {
  userId: string | null;
  isSignedIn: boolean;
  isDemo: boolean;
  clerkEnabled: boolean;
};

export const getSession = cache(async (): Promise<Session> => {
  const clerkEnabled = isClerkConfigured();

  if (clerkEnabled) {
    const { userId } = await auth();
    if (userId) {
      return {
        userId,
        isSignedIn: true,
        isDemo: false,
        clerkEnabled,
      };
    }
  }

  const demoUserId = await readDemoUserId();
  if (demoUserId) {
    return {
      userId: demoUserId,
      isSignedIn: false,
      isDemo: true,
      clerkEnabled,
    };
  }

  return {
    userId: null,
    isSignedIn: false,
    isDemo: false,
    clerkEnabled,
  };
});

export async function requireUserId() {
  const session = await getSession();
  if (!session.userId) {
    redirect("/");
  }
  return session.userId;
}
