import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Session = {
  userId: string | null;
  email: string | null;
  isSignedIn: boolean;
  isDemo: boolean;
};

export const getSession = cache(async (): Promise<Session> => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError" && error.status !== 401 && error.status !== 403) {
    throw error;
  }
  return {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    isSignedIn: Boolean(user && !user.is_anonymous),
    isDemo: Boolean(user?.is_anonymous),
  };
});

export async function requireUserId() {
  const session = await getSession();
  if (!session.userId) redirect("/");
  return session.userId;
}

export async function ensureUserId() {
  const session = await getSession();
  if (session.userId) return session.userId;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) throw error ?? new Error("Could not start a demo session.");
  return data.user.id;
}
