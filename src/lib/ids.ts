import { parseInstrument, type Instrument } from "@/lib/instrument";

export const ITUNES_ALBUM_RE = /^itunes-(\d+)$/;
export const ITUNES_TAB_RE = /^itunes-(\d+)-(\d+)(?:-(guitar|bass|drums))?$/;

export function itunesAlbumId(collectionId: number) {
  return `itunes-${collectionId}`;
}

export function itunesTrackId(collectionId: number, trackNumber: number) {
  return `itunes-${collectionId}-${trackNumber}`;
}

export function itunesTabPath(
  collectionId: number,
  trackNumber: number,
  instrument: Instrument = "guitar",
) {
  return `/tab/itunes-${collectionId}-${trackNumber}-${instrument}`;
}

export function partTabHref(
  collectionId: string | number | null | undefined,
  trackNumber: number,
  instrument: Instrument,
  tabId: string,
) {
  if (collectionId) return itunesTabPath(Number(collectionId), trackNumber, instrument);
  return `/tab/${tabId}`;
}

export function parseItunesAlbumId(id: string) {
  const match = id.match(ITUNES_ALBUM_RE);
  return match ? Number(match[1]) : null;
}

export function parseItunesTabId(id: string) {
  const match = id.match(ITUNES_TAB_RE);
  if (!match) return null;
  return {
    collectionId: Number(match[1]),
    trackNumber: Number(match[2]),
    instrument: parseInstrument(match[3]),
  };
}

export function userTabId(userId: string, trackId: string, instrument: Instrument = "guitar") {
  return `tab:${userId}:${trackId}:${instrument}`;
}
