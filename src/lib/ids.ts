export const ITUNES_ALBUM_RE = /^itunes-(\d+)$/;
export const ITUNES_TAB_RE = /^itunes-(\d+)-(\d+)$/;

export function itunesAlbumId(collectionId: number) {
  return `itunes-${collectionId}`;
}

export function itunesTrackId(collectionId: number, trackNumber: number) {
  return `itunes-${collectionId}-${trackNumber}`;
}

export function itunesTabPath(collectionId: number, trackNumber: number) {
  return `/tab/itunes-${collectionId}-${trackNumber}`;
}

export function parseItunesAlbumId(id: string) {
  const match = id.match(ITUNES_ALBUM_RE);
  return match ? Number(match[1]) : null;
}

export function parseItunesTabId(id: string) {
  const match = id.match(ITUNES_TAB_RE);
  if (!match) return null;
  return { collectionId: Number(match[1]), trackNumber: Number(match[2]) };
}

export function userTabId(userId: string, trackId: string) {
  return `tab:${userId}:${trackId}`;
}
