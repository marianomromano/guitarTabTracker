"use server";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { albums, artists, tabs, tracks } from "@/db/schema";
import { requireUserId } from "@/lib/auth";
import {
  lookupItunesAlbum,
  searchItunesAlbums,
  titlesMatch,
  type ItunesAlbumOption,
} from "@/lib/itunes";
import { searchSongsterr, songsterrViewUrl, type SongsterrSong } from "@/lib/songsterr";
import { revalidatePath } from "next/cache";

export type AddTabResult =
  | { ok: true; albumId: string }
  | { ok: false; needsAlbumPick: true; albums: ItunesAlbumOption[] }
  | { ok: false; error: string };

export async function addTabAction(input: {
  songsterrId: number;
  songsterrTitle: string;
  songsterrArtist: string;
  collectionId?: number;
}): Promise<AddTabResult> {
  const userId = await requireUserId();
  const artistName = input.songsterrArtist.trim();
  const title = input.songsterrTitle.trim();

  let collectionId = input.collectionId;
  if (!collectionId) {
    const matches = await searchItunesAlbums(artistName, title);
    if (matches.length === 0) {
      return {
        ok: false,
        error: "Could not find an album for that song. Try another search result.",
      };
    }
    if (matches.length > 1) {
      return { ok: false, needsAlbumPick: true, albums: matches };
    }
    collectionId = matches[0].collectionId;
  }

  const lookup = await lookupItunesAlbum(collectionId);
  if (lookup.tracks.length === 0) {
    return { ok: false, error: "That album has no tracks in iTunes." };
  }
  if (lookup.tracks.length > 20) {
    return {
      ok: false,
      error: "That release looks like a compilation. Pick a single studio album.",
    };
  }

  const matchedTrack = lookup.tracks.find((track) =>
    titlesMatch(track.trackName, title),
  );
  if (!matchedTrack) {
    return {
      ok: false,
      error: `Could not match "${title}" to a track on ${lookup.album.collectionName}.`,
    };
  }

  const db = getDb();
  const artistId = crypto.randomUUID();
  const albumId = crypto.randomUUID();

  const existingArtist = db
    .select()
    .from(artists)
    .where(eq(artists.name, lookup.album.artistName))
    .get();

  const savedArtist =
    existingArtist ??
    db
      .insert(artists)
      .values({
        id: artistId,
        name: lookup.album.artistName,
        itunesArtistId: lookup.artistId ? String(lookup.artistId) : null,
      })
      .returning()
      .get();

  const existingAlbum = lookup.album.collectionId
    ? db
        .select()
        .from(albums)
        .where(eq(albums.itunesCollectionId, String(lookup.album.collectionId)))
        .get()
    : undefined;

  const savedAlbum =
    existingAlbum ??
    db
      .insert(albums)
      .values({
        id: albumId,
        artistId: savedArtist.id,
        title: lookup.album.collectionName,
        itunesCollectionId: String(lookup.album.collectionId),
        artworkUrl: lookup.album.artworkUrl,
        releaseYear: lookup.album.releaseYear,
      })
      .returning()
      .get();

  const existingTracks = db
    .select()
    .from(tracks)
    .where(eq(tracks.albumId, savedAlbum.id))
    .all();

  if (existingTracks.length === 0) {
    db.insert(tracks)
      .values(
        lookup.tracks.map((track) => ({
          id: crypto.randomUUID(),
          albumId: savedAlbum.id,
          title: track.trackName,
          trackNumber: track.trackNumber || lookup.tracks.indexOf(track) + 1,
        })),
      )
      .run();
  }

  const albumTracks = db
    .select()
    .from(tracks)
    .where(eq(tracks.albumId, savedAlbum.id))
    .all();

  const dbTrack = albumTracks.find((track) =>
    titlesMatch(track.title, matchedTrack.trackName),
  );
  if (!dbTrack) {
    return { ok: false, error: "Saved the album but could not attach the tab to a track." };
  }

  const existingTab = db
    .select()
    .from(tabs)
    .where(and(eq(tabs.userId, userId), eq(tabs.trackId, dbTrack.id)))
    .get();

  if (existingTab) {
    db.update(tabs)
      .set({
        songsterrId: input.songsterrId,
        songsterrUrl: songsterrViewUrl(input.songsterrId),
      })
      .where(eq(tabs.id, existingTab.id))
      .run();
  } else {
    db.insert(tabs)
      .values({
        id: crypto.randomUUID(),
        userId,
        trackId: dbTrack.id,
        songsterrId: input.songsterrId,
        songsterrUrl: songsterrViewUrl(input.songsterrId),
        createdAt: new Date().toISOString(),
      })
      .run();
  }

  revalidatePath("/");
  revalidatePath(`/album/${savedAlbum.id}`);
  return { ok: true, albumId: savedAlbum.id };
}

export async function searchTabsAction(query: string): Promise<SongsterrSong[]> {
  return searchSongsterr(query);
}

export async function linkTabToTrackAction(input: {
  trackId: string;
  songsterrId: number;
}): Promise<{ ok: true; tabId: string } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const db = getDb();

  const track = db
    .select({
      id: tracks.id,
      albumId: tracks.albumId,
    })
    .from(tracks)
    .where(eq(tracks.id, input.trackId))
    .get();

  if (!track) {
    return { ok: false, error: "That song is not on this album." };
  }

  const existingTab = db
    .select()
    .from(tabs)
    .where(and(eq(tabs.userId, userId), eq(tabs.trackId, track.id)))
    .get();

  const songsterrUrl = songsterrViewUrl(input.songsterrId);
  let tabId: string;

  if (existingTab) {
    db.update(tabs)
      .set({
        songsterrId: input.songsterrId,
        songsterrUrl,
      })
      .where(eq(tabs.id, existingTab.id))
      .run();
    tabId = existingTab.id;
  } else {
    tabId = crypto.randomUUID();
    db.insert(tabs)
      .values({
        id: tabId,
        userId,
        trackId: track.id,
        songsterrId: input.songsterrId,
        songsterrUrl,
        createdAt: new Date().toISOString(),
      })
      .run();
  }

  revalidatePath("/");
  revalidatePath(`/album/${track.albumId}`);
  revalidatePath(`/tab/${tabId}`);
  return { ok: true, tabId };
}

export async function removeTabAction(tabId: string) {
  const userId = await requireUserId();
  const db = getDb();
  const existing = db
    .select({
      id: tabs.id,
      albumId: tracks.albumId,
    })
    .from(tabs)
    .innerJoin(tracks, eq(tabs.trackId, tracks.id))
    .where(and(eq(tabs.id, tabId), eq(tabs.userId, userId)))
    .get();

  db.delete(tabs).where(and(eq(tabs.id, tabId), eq(tabs.userId, userId))).run();
  revalidatePath("/");
  if (existing) {
    revalidatePath(`/album/${existing.albumId}`);
  }
}
