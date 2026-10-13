import { createPrivateKey, sign } from "node:crypto";

const SIX_MONTHS = 60 * 60 * 24 * 180;
let cached: { token: string; expiresAt: number; origin: string } | null = null;

export function isMusicKitConfigured() {
  return Boolean(
    process.env.APPLE_MUSIC_DEVELOPER_TOKEN ||
      (process.env.APPLE_TEAM_ID && process.env.APPLE_MUSIC_KEY_ID && process.env.APPLE_MUSIC_PRIVATE_KEY),
  );
}

export function getMusicKitDeveloperToken(requestOrigin?: string | null) {
  const ready = process.env.APPLE_MUSIC_DEVELOPER_TOKEN?.trim();
  if (ready) return ready;
  if (!isMusicKitConfigured()) return null;

  const origin = resolveMusicKitOrigin(requestOrigin);
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.origin === origin && cached.expiresAt - 60 * 60 * 24 > now) {
    return cached.token;
  }

  const teamId = process.env.APPLE_TEAM_ID!.trim();
  const keyId = process.env.APPLE_MUSIC_KEY_ID!.trim();
  const privateKey = normalizePrivateKey(process.env.APPLE_MUSIC_PRIVATE_KEY!);
  const exp = now + SIX_MONTHS;
  const token = signMusicKitJwt({ teamId, keyId, privateKey, iat: now, exp, origin });
  cached = { token, expiresAt: exp, origin };
  return token;
}

function resolveMusicKitOrigin(requestOrigin?: string | null) {
  const candidates = [
    requestOrigin,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    "http://localhost:3001",
  ];
  for (const value of candidates) {
    if (!value) continue;
    try {
      return new URL(value.includes("://") ? value : `https://${value}`).origin;
    } catch {
      // Try the next candidate.
    }
  }
  return "http://localhost:3001";
}

function normalizePrivateKey(value: string) {
  let key = value.replace(/\\n/g, "\n").trim();
  if (!key.includes("BEGIN PRIVATE KEY")) {
    key = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
  }
  return key;
}

function signMusicKitJwt({
  teamId,
  keyId,
  privateKey,
  iat,
  exp,
  origin,
}: {
  teamId: string;
  keyId: string;
  privateKey: string;
  iat: number;
  exp: number;
  origin: string;
}) {
  const header = base64Url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const payload = base64Url(JSON.stringify({ iss: teamId, iat, exp, origin }));
  const data = `${header}.${payload}`;
  const key = createPrivateKey(privateKey);
  const signature = sign("sha256", Buffer.from(data), {
    key,
    dsaEncoding: "ieee-p1363",
  });
  return `${data}.${signature.toString("base64url")}`;
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}
