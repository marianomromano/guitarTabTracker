import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { albums, artists, tabs, tracks } from "@/db/schema";
import { placeholderAlphaTex } from "@/lib/alphatex";
import { itunesAlbumId, itunesTrackId, userTabId } from "@/lib/ids";
import type { Instrument } from "@/lib/instrument";
import { lookupItunesAlbum } from "@/lib/itunes";

export async function ensureItunesAlbum(collectionId: number) {
  const lookup = await lookupItunesAlbum(collectionId);
  if (lookup.tracks.length === 0) return null;
  const db = await getDb();
  const artistName = lookup.album.artistName;
  return db.transaction(async (tx) => {
    await tx.insert(artists).values({
      id: lookup.artistId ? `itunes-artist-${lookup.artistId}` : `itunes-artist-${collectionId}`,
      name: artistName,
      itunesArtistId: lookup.artistId ? String(lookup.artistId) : null,
    }).onConflictDoNothing();
    const [artist] = await tx.select().from(artists).where(eq(artists.name, artistName)).limit(1);
    if (!artist) throw new Error("Could not save the album artist.");
    await tx.insert(albums).values({
      id: itunesAlbumId(collectionId), artistId: artist.id,
      title: lookup.album.collectionName, itunesCollectionId: String(collectionId),
      artworkUrl: lookup.album.artworkUrl, releaseYear: lookup.album.releaseYear,
    }).onConflictDoNothing();
    const [album] = await tx.select().from(albums)
      .where(eq(albums.itunesCollectionId, String(collectionId))).limit(1);
    if (!album) throw new Error("Could not save the album.");
    const existingTracks = await tx.select().from(tracks).where(eq(tracks.albumId, album.id));
    const multiDisc = lookup.tracks.some(track => track.discNumber > 1);
    const missing = lookup.tracks.map((track, index) => {
      const trackNumber = multiDisc ? index + 1 : track.trackNumber || index + 1;
      return {
        id: itunesTrackId(collectionId, trackNumber), albumId: album.id,
        title: track.trackName, trackNumber,
        previewUrl: track.previewUrl, appleMusicId: track.appleMusicId,
      };
    }).filter(track => !existingTracks.some(existing => existing.trackNumber === track.trackNumber));
    if (missing.length) await tx.insert(tracks).values(missing).onConflictDoNothing();
    const albumTracks = await tx.select().from(tracks).where(eq(tracks.albumId, album.id));
    return { album, tracks: albumTracks, artistName };
  });
}

export async function ensureUserTab(
  userId: string, trackId: string, title: string, artistName: string,
  instrument: Instrument = "guitar",
) {
  const db = await getDb();
  await db.insert(tabs).values({
    id: userTabId(userId, trackId, instrument), userId, trackId, instrument,
    songsterrId: 0, songsterrUrl: "",
    tabTex: placeholderAlphaTex(title, artistName, instrument),
    createdAt: new Date().toISOString(),
  }).onConflictDoNothing({ target: [tabs.userId, tabs.trackId, tabs.instrument] });
  const [saved] = await db.select().from(tabs).where(and(
    eq(tabs.userId, userId), eq(tabs.trackId, trackId), eq(tabs.instrument, instrument),
  )).limit(1);
  if (!saved) throw new Error("Could not save the tab.");
  return saved;
}
