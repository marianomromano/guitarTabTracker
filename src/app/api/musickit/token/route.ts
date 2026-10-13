import { getMusicKitDeveloperToken, isMusicKitConfigured } from "@/lib/musickit-token";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isMusicKitConfigured()) {
    return Response.json({ configured: false, token: null });
  }

  const token = getMusicKitDeveloperToken();
  if (!token) {
    return Response.json({ configured: false, token: null }, { status: 500 });
  }

  return Response.json({
    configured: true,
    token,
    storefront: process.env.NEXT_PUBLIC_APPLE_MUSIC_STOREFRONT || "us",
  });
}
