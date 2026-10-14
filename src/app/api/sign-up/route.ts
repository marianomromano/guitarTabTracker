import { NextResponse } from "next/server";
import { createUser, findUserByEmail, parseEmail, parsePassword } from "@/lib/accounts";
import { applySessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = parseEmail(formData.get("email"));
  const password = parsePassword(formData.get("password"));
  const origin = request.headers.get("origin");
  const base = origin && URL.canParse(origin) ? origin : new URL(request.url).origin;

  if (!email || !password) {
    return NextResponse.redirect(new URL("/sign-up?error=invalid", base), 303);
  }

  if (findUserByEmail(email)) {
    return NextResponse.redirect(new URL("/sign-up?error=exists", base), 303);
  }

  const user = createUser(email, password);
  const response = NextResponse.redirect(new URL("/library", base), 303);
  applySessionCookie(response, user);
  return response;
}
