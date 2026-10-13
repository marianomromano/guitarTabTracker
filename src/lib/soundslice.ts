const HASH_RE = /^[A-Za-z0-9]{3,8}$/;
const URL_RE = /soundslice\.com\/(?:slices|scores)\/([A-Za-z0-9]{3,8})/i;

export function parseSoundsliceHash(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (HASH_RE.test(trimmed)) return trimmed;
  return trimmed.match(URL_RE)?.[1] ?? null;
}

export function soundsliceEmbedUrl(hash: string) {
  return `https://www.soundslice.com/slices/${hash}/embed/?api=1&narrow_song_name=1`;
}

export function soundsliceViewUrl(hash: string) {
  return `https://www.soundslice.com/slices/${hash}/`;
}
