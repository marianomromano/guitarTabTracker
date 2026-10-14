"use server";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { albums, artists, tabs, tracks } from "@/db/schema";
import { redirect } from "next/navigation";
import { ensureUserId, getSession, requireUserId } from "@/lib/auth";
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
  searchItunesSongs,
  titlesMatch,
  type ItunesAlbumOption,
  type ItunesSongOption,
} from "@/lib/itunes";
import { isAlphaTexFile, isTabFile, placeholderAlphaTex } from "@/lib/alphatex";
import { ensureItunesAlbum, ensureUserTab } from "@/lib/hydrate";
import { itunesAlbumId, partTabHref, parseItunesAlbumId, userTabId } from "@/lib/ids";
import { parseInstrument, parseInstruments } from "@/lib/instrument";
import { persistLibrary } from "@/lib/library-persist";
import { rememberShelfPart, rememberShelfParts } from "@/lib/shelf";
import { parseSoundsliceHash } from "@/lib/soundslice";
import { revalidatePath } from "next/cache";

export type AddTabResult =
  | { ok: true; albumId: string; tabId: string; tabHref: string }
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

export async function claimDemoLibraryAction() {
  const session = await getSession();
  if (!session.isSignedIn || !session.userId) return;

  const demoUserId = await readDemoUserId();
  if (!demoUserId) return;

  await claimDemoTabs(session.userId, demoUserId);
  await clearDemoCookie();
  revalidatePath("/library");
  revalidatePath("/");
}

export async function addTabAction(input: {
  title: string;
  artist: string;
  collectionId?: number;
  instruments?: string[];
}): Promise<AddTabResult> {
  try {
    return await addTab(input);
  } catch (error) {
    return saveFailed(error, "Could not save that album. Try again.");
  }
}

export async function addTab(input: {
  title: string;
  artist: string;
  collectionId?: number;
  instruments?: string[];
}): Promise<AddTabResult> {
  const userId = await ensureUserId();
  const artistName = input.artist.trim();
  const title = input.title.trim();
  const instruments = parseInstruments(input.instruments);

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

  const hydrated = await ensureItunesAlbum(collectionId);
  if (!hydrated) {
    return { ok: false, error: "Could not save that album. Try again." };
  }

  await applyPreviewUrls(hydrated.album.id, lookup.tracks);

  const dbTrack = hydrated.tracks.find((track) =>
    titlesMatch(track.title, matchedTrack.trackName),
  );
  if (!dbTrack) {
    return { ok: false, error: "Saved the album but could not attach the tab to a track." };
  }

  let savedTabId = "";
  let tabHref = "";
  for (const instrument of instruments) {
    const savedTab = await ensureUserTab(
      userId,
      dbTrack.id,
      dbTrack.title,
      lookup.album.artistName,
      instrument,
    );
    await rememberShelfPart(collectionId, dbTrack.trackNumber, instrument);
    if (!savedTabId) {
      savedTabId = savedTab.id;
      tabHref = partTabHref(collectionId, dbTrack.trackNumber, instrument, savedTab.id);
    }
  }

  const albumHrefId = hydrated.album.itunesCollectionId
    ? itunesAlbumId(Number(hydrated.album.itunesCollectionId))
    : hydrated.album.id;

  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath(`/album/${albumHrefId}`);
  revalidatePath(tabHref);
  return { ok: true, albumId: albumHrefId, tabId: savedTabId, tabHref };
}

export async function addPartAction(input: {
  trackId: string;
  instrument: string;
}): Promise<{ ok: true; tabHref: string } | { ok: false; error: string }> {
  try {
    const userId = await ensureUserId();
    const instrument = parseInstrument(input.instrument);
    const db = await getDb();
    const track = db
      .select({
        id: tracks.id,
        title: tracks.title,
        trackNumber: tracks.trackNumber,
        albumId: albums.id,
        artistName: artists.name,
        itunesCollectionId: albums.itunesCollectionId,
      })
      .from(tracks)
      .innerJoin(albums, eq(tracks.albumId, albums.id))
      .innerJoin(artists, eq(albums.artistId, artists.id))
      .where(eq(tracks.id, input.trackId))
      .get();

    if (!track) {
      return { ok: false, error: "That song is not on this album." };
    }

    const savedTab = await ensureUserTab(
      userId,
      track.id,
      track.title,
      track.artistName,
      instrument,
    );
    if (track.itunesCollectionId) {
      await rememberShelfPart(Number(track.itunesCollectionId), track.trackNumber, instrument);
    }

    const tabHref = partTabHref(
      track.itunesCollectionId,
      track.trackNumber,
      instrument,
      savedTab.id,
    );
    revalidatePath("/");
    revalidatePath("/library");
    revalidatePath(`/album/${track.albumId}`);
    revalidatePath(tabHref);
    return { ok: true, tabHref };
  } catch (error) {
    return saveFailed(error, "Could not add that part.");
  }
}

export async function searchTabsAction(query: string): Promise<ItunesSongOption[]> {
  return searchItunesSongs(query);
}

export async function attachSoundsliceAction(input: {
  trackId: string;
  url: string;
  instrument?: string;
}): Promise<{ ok: true; tabId: string } | { ok: false; error: string }> {
  try {
    const hash = parseSoundsliceHash(input.url);
    if (!hash) {
      return { ok: false, error: "Paste a Soundslice slice URL or hash." };
    }
    return await upsertTrackTab(input.trackId, parseInstrument(input.instrument), {
      soundsliceHash: hash,
      tabTex: null,
      tabFile: null,
      tabFilename: null,
    });
  } catch (error) {
    return saveFailed(error, "Could not attach that Soundslice tab.");
  }
}

export async function uploadTabFileAction(
  formData: FormData,
): Promise<{ ok: true; tabId: string } | { ok: false; error: string }> {
  try {
    const trackId = String(formData.get("trackId") ?? "");
    const instrument = parseInstrument(String(formData.get("instrument") ?? ""));
    const file = formData.get("file");
    if (!trackId || !(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Choose a Guitar Pro, MusicXML, or alphaTex file." };
    }
    if (file.size > 2_000_000) {
      return { ok: false, error: "That file is larger than 2 MB." };
    }
    if (!isTabFile(file.name)) {
      return { ok: false, error: "Use a .gp, .gpx, .xml, or .tex tab file." };
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (isAlphaTexFile(file.name)) {
      return await upsertTrackTab(trackId, instrument, {
        tabTex: bytes.toString("utf8"),
        tabFile: null,
        tabFilename: file.name,
        soundsliceHash: null,
      });
    }

    return await upsertTrackTab(trackId, instrument, {
      tabFile: bytes.toString("base64"),
      tabFilename: file.name,
      tabTex: null,
      soundsliceHash: null,
    });
  } catch (error) {
    return saveFailed(error, "Could not upload that tab.");
  }
}

async function upsertTrackTab(
  trackId: string,
  instrument: ReturnType<typeof parseInstrument>,
  values: {
    tabTex: string | null;
    tabFile: string | null;
    tabFilename: string | null;
    soundsliceHash: string | null;
  },
): Promise<{ ok: true; tabId: string } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const db = await getDb();

  const track = db
    .select({
      id: tracks.id,
      title: tracks.title,
      trackNumber: tracks.trackNumber,
      albumId: albums.id,
      artistName: artists.name,
      itunesCollectionId: albums.itunesCollectionId,
    })
    .from(tracks)
    .innerJoin(albums, eq(tracks.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(eq(tracks.id, trackId))
    .get();

  if (!track) {
    return { ok: false, error: "That song is not on this album." };
  }

  const existingTab = db
    .select()
    .from(tabs)
    .where(
      and(eq(tabs.userId, userId), eq(tabs.trackId, track.id), eq(tabs.instrument, instrument)),
    )
    .get();

  let tabId: string;
  if (existingTab) {
    db.update(tabs).set(values).where(eq(tabs.id, existingTab.id)).run();
    tabId = existingTab.id;
  } else {
    tabId = userTabId(userId, track.id, instrument);
    db.insert(tabs)
      .values({
        id: tabId,
        userId,
        trackId: track.id,
        instrument,
        songsterrId: 0,
        songsterrUrl: "",
        tabTex: values.tabTex ?? placeholderAlphaTex(track.title, track.artistName, instrument),
        tabFile: values.tabFile,
        tabFilename: values.tabFilename,
        soundsliceHash: values.soundsliceHash,
        createdAt: new Date().toISOString(),
      })
      .run();
  }

  if (track.itunesCollectionId) {
    await rememberShelfPart(Number(track.itunesCollectionId), track.trackNumber, instrument);
  }

  const tabHref = partTabHref(
    track.itunesCollectionId,
    track.trackNumber,
    instrument,
    tabId,
  );
  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath(`/album/${track.albumId}`);
  revalidatePath(`/tab/${tabId}`);
  revalidatePath(tabHref);
  await persistLibrary();
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
  const db = await getDb();
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
  await persistLibrary();
  revalidatePath("/");
  if (existing) {
    revalidatePath(`/album/${existing.albumId}`);
  }
}

export async function syncAlbumPreviewsAction(albumId: string) {
  await requireUserId();
  const db = await getDb();
  const collectionId = parseItunesAlbumId(albumId);
  const album =
    db
      .select({
        id: albums.id,
        itunesCollectionId: albums.itunesCollectionId,
      })
      .from(albums)
      .where(eq(albums.id, albumId))
      .get() ??
    (collectionId
      ? db
          .select({
            id: albums.id,
            itunesCollectionId: albums.itunesCollectionId,
          })
          .from(albums)
          .where(eq(albums.itunesCollectionId, String(collectionId)))
          .get()
      : undefined);

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
    await applyPreviewUrls(album.id, lookup.tracks);
  } catch (error) {
    console.error(error);
  }
}

export async function fillMissingAlbumTabsAction(albumId: string) {
  const userId = await requireUserId();
  const db = await getDb();
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
      await applyPreviewUrls(album.id, lookup.tracks);
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
  const db = await getDb();
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
    void persistLibrary();
  }

  return { previewUrl, appleMusicId };
}

async function applyPreviewUrls(
  albumId: string,
  itunesTracks: { trackName: string; previewUrl: string | null; appleMusicId: string | null }[],
) {
  const db = await getDb();
  const albumTracks = db.select().from(tracks).where(eq(tracks.albumId, albumId)).all();
  let wrote = false;
  for (const track of albumTracks) {
    const match = itunesTracks.find((item) => titlesMatch(item.trackName, track.title));
    if (!match) continue;
    const updates: { previewUrl?: string; appleMusicId?: string } = {};
    if (!track.previewUrl && match.previewUrl) updates.previewUrl = match.previewUrl;
    if (!track.appleMusicId && match.appleMusicId) updates.appleMusicId = match.appleMusicId;
    if (Object.keys(updates).length) {
      db.update(tracks).set(updates).where(eq(tracks.id, track.id)).run();
      wrote = true;
    }
  }
  if (wrote) await persistLibrary();
}

async function linkMissingAlbumTabs(userId: string, albumId: string, artistName: string) {
  const db = await getDb();
  const album = db
    .select({ itunesCollectionId: albums.itunesCollectionId })
    .from(albums)
    .where(eq(albums.id, albumId))
    .get();
  const collectionId = album?.itunesCollectionId ? Number(album.itunesCollectionId) : null;

  const albumTracks = db
    .select({
      id: tracks.id,
      title: tracks.title,
      trackNumber: tracks.trackNumber,
      tabId: tabs.id,
    })
    .from(tracks)
    .leftJoin(
      tabs,
      and(eq(tabs.trackId, tracks.id), eq(tabs.userId, userId), eq(tabs.instrument, "guitar")),
    )
    .where(eq(tracks.albumId, albumId))
    .all();

  const missing = albumTracks.filter((track) => !track.tabId);
  const added: { trackNumber: number }[] = [];

  for (const track of missing) {
    const existing = db
      .select({ id: tabs.id })
      .from(tabs)
      .where(and(eq(tabs.userId, userId), eq(tabs.trackId, track.id), eq(tabs.instrument, "guitar")))
      .get();
    if (existing) continue;
    await ensureUserTab(userId, track.id, track.title, artistName, "guitar");
    added.push({ trackNumber: track.trackNumber });
  }

  if (collectionId && added.length > 0) {
    await rememberShelfParts(
      added.map((track) => ({
        collectionId,
        trackNumber: track.trackNumber,
        instrument: "guitar" as const,
      })),
    );
  }

  return added.length;
}
