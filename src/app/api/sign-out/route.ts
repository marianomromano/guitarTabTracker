import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const base = origin && URL.canParse(origin) ? origin : new URL(request.url).origin;
  const response = NextResponse.redirect(new URL("/", base), 303);
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.VERCEL === "1",
  });
  return response;
}
