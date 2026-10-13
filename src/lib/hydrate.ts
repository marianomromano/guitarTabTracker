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

  const db = getDb();
  const artistName = lookup.album.artistName;

  let artist = db.select().from(artists).where(eq(artists.name, artistName)).get();
  if (!artist) {
    try {
      artist = db
        .insert(artists)
        .values({
          id: lookup.artistId ? `itunes-artist-${lookup.artistId}` : `itunes-artist-${collectionId}`,
          name: artistName,
          itunesArtistId: lookup.artistId ? String(lookup.artistId) : null,
        })
        .returning()
        .get();
    } catch {
      artist = db.select().from(artists).where(eq(artists.name, artistName)).get();
    }
  }
  if (!artist) return null;

  let album = db
    .select()
    .from(albums)
    .where(eq(albums.itunesCollectionId, String(collectionId)))
    .get();

  if (!album) {
    try {
      album = db
        .insert(albums)
        .values({
          id: itunesAlbumId(collectionId),
          artistId: artist.id,
          title: lookup.album.collectionName,
          itunesCollectionId: String(collectionId),
          artworkUrl: lookup.album.artworkUrl,
          releaseYear: lookup.album.releaseYear,
        })
        .returning()
        .get();
    } catch {
      album = db
        .select()
        .from(albums)
        .where(eq(albums.itunesCollectionId, String(collectionId)))
        .get();
    }
  }
  if (!album) return null;

  const existingTracks = db.select().from(tracks).where(eq(tracks.albumId, album.id)).all();
  if (existingTracks.length === 0) {
    db.insert(tracks)
      .values(
        lookup.tracks.map((track, index) => {
          const trackNumber = track.trackNumber || index + 1;
          return {
            id: itunesTrackId(collectionId, trackNumber),
            albumId: album.id,
            title: track.trackName,
            trackNumber,
            previewUrl: track.previewUrl,
            appleMusicId: track.appleMusicId,
          };
        }),
      )
      .run();
  }

  const albumTracks = db.select().from(tracks).where(eq(tracks.albumId, album.id)).all();
  return { album, tracks: albumTracks, artistName };
}

export function ensureUserTab(
  userId: string,
  trackId: string,
  title: string,
  artistName: string,
  instrument: Instrument = "guitar",
) {
  const db = getDb();
  const existing = db
    .select()
    .from(tabs)
    .where(and(eq(tabs.userId, userId), eq(tabs.trackId, trackId), eq(tabs.instrument, instrument)))
    .get();
  if (existing) return existing;

  const id = userTabId(userId, trackId, instrument);
  try {
    db.insert(tabs)
      .values({
        id,
        userId,
        trackId,
        instrument,
        songsterrId: 0,
        songsterrUrl: "",
        tabTex: placeholderAlphaTex(title, artistName, instrument),
        createdAt: new Date().toISOString(),
      })
      .run();
    return db.select().from(tabs).where(eq(tabs.id, id)).get() ?? { id, userId, trackId, instrument };
  } catch {
    return (
      db
        .select()
        .from(tabs)
        .where(and(eq(tabs.userId, userId), eq(tabs.trackId, trackId), eq(tabs.instrument, instrument)))
        .get() ?? { id, userId, trackId, instrument }
    );
  }
}
