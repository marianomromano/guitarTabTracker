import { NextResponse } from "next/server";
import { requestOrigin } from "@/lib/safe-path";
import { createClient } from "@/lib/supabase/server";
import { claimDemoTabs, readDemoUserId } from "@/lib/demo";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const code = url.searchParams.get("code");
  const supabase = await createClient();
  const demoId = await readDemoUserId();
  const result = tokenHash
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" })
    : code ? await supabase.auth.exchangeCodeForSession(code) : null;
  if (!result || result.error || !result.data.user) {
    return NextResponse.redirect(new URL("/sign-in?error=confirmation", requestOrigin(request)), 303);
  }
  if (demoId) await claimDemoTabs(result.data.user.id, demoId);
  return NextResponse.redirect(new URL("/library", requestOrigin(request)), 303);
}
