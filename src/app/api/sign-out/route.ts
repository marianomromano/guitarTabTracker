import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOrigin, requestOrigin } from "@/lib/safe-path";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new Response("Invalid origin", { status: 403 });
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return new Response("Could not sign out. Try again.", { status: 503 });
  const response = NextResponse.redirect(new URL("/", requestOrigin(request)), 303);
  for (const name of ["tabshelf_session", "tabshelf-demo-id", "tabshelf-shelf"]) response.cookies.delete(name);
  return response;
}
