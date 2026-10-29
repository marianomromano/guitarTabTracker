import { NextResponse } from "next/server";
import { parseEmail, parsePassword } from "@/lib/accounts";
import { createClient } from "@/lib/supabase/server";
import { claimDemoTabs, readDemoUserId } from "@/lib/demo";
import { isSameOrigin, requestOrigin } from "@/lib/safe-path";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new Response("Invalid origin", { status: 403 });
  const base = requestOrigin(request);
  const formData = await request.formData();
  const email = parseEmail(formData.get("email"));
  const password = parsePassword(formData.get("password"));
  if (!email || !password) return NextResponse.redirect(new URL("/sign-in?error=invalid", base), 303);
  const demoId = await readDemoUserId();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    const code = error?.code === "email_not_confirmed" ? "unconfirmed" : "wrong";
    return NextResponse.redirect(new URL(`/sign-in?error=${code}`, base), 303);
  }
  if (demoId) await claimDemoTabs(data.user.id, demoId);
  return NextResponse.redirect(new URL("/library", base), 303);
}
