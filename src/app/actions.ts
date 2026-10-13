"use server";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { albums, artists, tabs, tracks } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { isClerkConfigured } from "@/lib/auth-config";
import {
  createClerkSignInTicket,
  findClerkUserIdByEmail,
  verifyClerkPassword,
} from "@/lib/clerk-admin";
import {
  claimDemoTabs,
  clearDemoCookie,
  ensureDemoCookie,
  readDemoUserId,
} from "@/lib/demo";
import {
  lookupItunesAlbum,
  searchItunesAlbums,
  searchItunesSong,
  titlesMatch,
  type ItunesAlbumOption,
} from "@/lib/itunes";
import {
  findSongsterrTab,
  searchSongsterr,
  songsterrViewUrl,
  type SongsterrSong,
} from "@/lib/songsterr";
import { revalidatePath } from "next/cache";

export type AddTabResult =
  | { ok: true; albumId: string }
  | { ok: false; needsAlbumPick: true; albums: ItunesAlbumOption[] }
  | { ok: false; error: string };

function saveFailed(error: unknown, fallback: string): { ok: false; error: string } {
  console.error(error);
  return { ok: false, error: fallback };
}

export async function startDemoAction() {
  await ensureDemoCookie();
  redirect("/library");
}

export async function passwordSignInAction(input: {
  email: string;
  password: string;
}): Promise<{ ok: true; ticket: string } | { ok: false; error: string }> {
  if (!isClerkConfigured()) {
    return { ok: false, error: "Sign-in is not connected yet." };
  }

  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!email || !password) {
    return { ok: false, error: "Enter your email and password." };
  }

  try {
    const userId = await findClerkUserIdByEmail(email);
    if (!userId || !(await verifyClerkPassword(userId, password))) {
      return { ok: false, error: "Incorrect email or password." };
    }

    const ticket = await createClerkSignInTicket(userId);
    return { ok: true, ticket };
  } catch (error) {
    return saveFailed(error, "Could not sign in right now. Try again.");
  }
}

export async function claimDemoLibraryAction() {
  if (!isClerkConfigured()) return;
  const { userId } = await auth();
  if (!userId) return;

  const demoUserId = await readDemoUserId();
  if (!demoUserId) return;

  claimDemoTabs(userId, demoUserId);
  await clearDemoCookie();
  revalidatePath("/library");
  revalidatePath("/");
}

export async function addTabAction(input: {
  songsterrId: number;
  songsterrTitle: string;
  songsterrArtist: string;
  collectionId?: number;
}): Promise<AddTabResult> {
  try {
    return await addTab(input);
  } catch (error) {
    return saveFailed(error, "Could not save that album. Try again.");
  }
}

async function addTab(input: {
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
          previewUrl: track.previewUrl,
          appleMusicId: track.appleMusicId,
        })),
      )
      .run();
  } else {
    applyPreviewUrls(savedAlbum.id, lookup.tracks);
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

  await linkMissingAlbumTabs(userId, savedAlbum.id, lookup.album.artistName);

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
  try {
    return await linkTabToTrack(input);
  } catch (error) {
    return saveFailed(error, "Could not link that tab. Try again.");
  }
}

async function linkTabToTrack(input: {
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
  try {
    await removeTab(tabId);
  } catch (error) {
    console.error(error);
  }
}

async function removeTab(tabId: string) {
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

export async function syncAlbumPreviewsAction(albumId: string) {
  await requireUserId();
  const db = getDb();
  const album = db
    .select({
      id: albums.id,
      itunesCollectionId: albums.itunesCollectionId,
    })
    .from(albums)
    .where(eq(albums.id, albumId))
    .get();

  if (!album?.itunesCollectionId) return;

  const needsMedia = db
    .select({
      id: tracks.id,
      previewUrl: tracks.previewUrl,
      appleMusicId: tracks.appleMusicId,
    })
    .from(tracks)
    .where(eq(tracks.albumId, albumId))
    .all()
    .some((track) => !track.previewUrl || !track.appleMusicId);

  if (!needsMedia) return;

  try {
    const lookup = await lookupItunesAlbum(Number(album.itunesCollectionId));
    applyPreviewUrls(album.id, lookup.tracks);
  } catch (error) {
    console.error(error);
  }
}

export async function fillMissingAlbumTabsAction(albumId: string) {
  const userId = await requireUserId();
  const db = getDb();
  const album = db
    .select({
      id: albums.id,
      artistName: artists.name,
      itunesCollectionId: albums.itunesCollectionId,
    })
    .from(albums)
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(eq(albums.id, albumId))
    .get();

  if (!album) return { ok: false as const, linked: 0 };

  if (album.itunesCollectionId) {
    try {
      const lookup = await lookupItunesAlbum(Number(album.itunesCollectionId));
      applyPreviewUrls(album.id, lookup.tracks);
    } catch (error) {
      console.error(error);
    }
  }

  const linked = await linkMissingAlbumTabs(userId, album.id, album.artistName);
  revalidatePath("/");
  revalidatePath(`/album/${album.id}`);
  return { ok: true as const, linked };
}

export async function resolveTrackPreviewAction(trackId: string) {
  const media = await resolveTrackMediaAction(trackId);
  return media?.previewUrl ?? null;
}

export async function resolveTrackMediaAction(trackId: string) {
  await requireUserId();
  const db = getDb();
  const row = db
    .select({
      id: tracks.id,
      title: tracks.title,
      previewUrl: tracks.previewUrl,
      appleMusicId: tracks.appleMusicId,
      albumTitle: albums.title,
      artistName: artists.name,
    })
    .from(tracks)
    .innerJoin(albums, eq(tracks.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(eq(tracks.id, trackId))
    .get();

  if (!row) return null;

  let previewUrl = row.previewUrl;
  let appleMusicId = row.appleMusicId;
  const updates: { previewUrl?: string; appleMusicId?: string } = {};

  if (!previewUrl || !appleMusicId) {
    const song = await searchItunesSong(row.artistName, row.title, row.albumTitle);
    if (!previewUrl && song.previewUrl) {
      previewUrl = song.previewUrl;
      updates.previewUrl = song.previewUrl;
    }
    if (!appleMusicId && song.appleMusicId) {
      appleMusicId = song.appleMusicId;
      updates.appleMusicId = song.appleMusicId;
    }
  }

  if (Object.keys(updates).length) {
    db.update(tracks).set(updates).where(eq(tracks.id, row.id)).run();
  }

  return { previewUrl, appleMusicId };
}

function applyPreviewUrls(
  albumId: string,
  itunesTracks: { trackName: string; previewUrl: string | null; appleMusicId: string | null }[],
) {
  const db = getDb();
  const albumTracks = db.select().from(tracks).where(eq(tracks.albumId, albumId)).all();
  for (const track of albumTracks) {
    const match = itunesTracks.find((item) => titlesMatch(item.trackName, track.title));
    if (!match) continue;
    const updates: { previewUrl?: string; appleMusicId?: string } = {};
    if (!track.previewUrl && match.previewUrl) updates.previewUrl = match.previewUrl;
    if (!track.appleMusicId && match.appleMusicId) updates.appleMusicId = match.appleMusicId;
    if (Object.keys(updates).length) {
      db.update(tracks).set(updates).where(eq(tracks.id, track.id)).run();
    }
  }
}

async function linkMissingAlbumTabs(userId: string, albumId: string, artistName: string) {
  const db = getDb();
  const albumTracks = db
    .select({
      id: tracks.id,
      title: tracks.title,
      tabId: tabs.id,
    })
    .from(tracks)
    .leftJoin(tabs, and(eq(tabs.trackId, tracks.id), eq(tabs.userId, userId)))
    .where(eq(tracks.albumId, albumId))
    .all();

  const missing = albumTracks.filter((track) => !track.tabId);
  let linked = 0;

  await mapPool(missing, 4, async (track) => {
    const match = await findSongsterrTab(artistName, track.title);
    if (!match) return;
    const existing = db
      .select({ id: tabs.id })
      .from(tabs)
      .where(and(eq(tabs.userId, userId), eq(tabs.trackId, track.id)))
      .get();
    if (existing) return;
    db.insert(tabs)
      .values({
        id: crypto.randomUUID(),
        userId,
        trackId: track.id,
        songsterrId: match.id,
        songsterrUrl: songsterrViewUrl(match.id),
        createdAt: new Date().toISOString(),
      })
      .run();
    linked += 1;
  });

  return linked;
}

async function mapPool<T>(items: T[], limit: number, work: (item: T) => Promise<void>) {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await work(current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
}
