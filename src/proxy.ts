import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkConfigured } from "@/lib/auth-config";

const clerkProxy = clerkMiddleware();

export default function proxy(...args: Parameters<typeof clerkProxy>) {
  if (!isClerkConfigured()) {
    return NextResponse.next();
  }
  return clerkProxy(...args);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
