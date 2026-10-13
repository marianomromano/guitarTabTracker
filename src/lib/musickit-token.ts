import { createPrivateKey, sign } from "node:crypto";

const SIX_MONTHS = 60 * 60 * 24 * 180;
let cached: { token: string; expiresAt: number } | null = null;

export function isMusicKitConfigured() {
  return Boolean(
    process.env.APPLE_MUSIC_DEVELOPER_TOKEN ||
      (process.env.APPLE_TEAM_ID && process.env.APPLE_MUSIC_KEY_ID && process.env.APPLE_MUSIC_PRIVATE_KEY),
  );
}

export function getMusicKitDeveloperToken() {
  const ready = process.env.APPLE_MUSIC_DEVELOPER_TOKEN?.trim();
  if (ready) return ready;
  if (!isMusicKitConfigured()) return null;

  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt - 60 * 60 * 24 > now) {
    return cached.token;
  }

  const teamId = process.env.APPLE_TEAM_ID!.trim();
  const keyId = process.env.APPLE_MUSIC_KEY_ID!.trim();
  const privateKey = normalizePrivateKey(process.env.APPLE_MUSIC_PRIVATE_KEY!);
  const exp = now + SIX_MONTHS;
  const token = signMusicKitJwt({ teamId, keyId, privateKey, iat: now, exp });
  cached = { token, expiresAt: exp };
  return token;
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
}: {
  teamId: string;
  keyId: string;
  privateKey: string;
  iat: number;
  exp: number;
}) {
  const header = base64Url(JSON.stringify({ alg: "ES256", kid: keyId }));
  const payload = base64Url(JSON.stringify({ iss: teamId, iat, exp }));
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
