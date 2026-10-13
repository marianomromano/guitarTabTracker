import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { albums, artists, tabs, tracks } from "@/db/schema";
import { placeholderAlphaTex } from "@/lib/alphatex";
import { ensureItunesAlbum, ensureUserTab } from "@/lib/hydrate";
import { parseItunesAlbumId, parseItunesTabId } from "@/lib/ids";
import {
  emptyParts,
  parseInstrument,
  type Instrument,
  type InstrumentParts,
} from "@/lib/instrument";
import { readShelfParts } from "@/lib/shelf";

export type LibraryAlbum = {
  id: string;
  title: string;
  artworkUrl: string | null;
  releaseYear: number | null;
  tabCount: number;
  itunesCollectionId: string | null;
};

export type LibraryArtist = {
  id: string;
  name: string;
  albums: LibraryAlbum[];
  coverAlbum: LibraryAlbum;
};

export type LibrarySong = {
  tabId: string;
  trackId: string;
  title: string;
  trackNumber: number;
  previewUrl: string | null;
  appleMusicId: string | null;
  albumId: string;
  albumTitle: string;
  artworkUrl: string | null;
  artistName: string;
  itunesCollectionId: string | null;
  instrument: Instrument;
};

export type TrackParts = InstrumentParts;

export type AlbumTrack = {
  id: string;
  title: string;
  trackNumber: number;
  previewUrl: string | null;
  appleMusicId: string | null;
  parts: TrackParts;
};

export type TabView = {
  id: string;
  trackId: string;
  instrument: Instrument;
  songsterrId: number | null;
  songsterrUrl: string | null;
  tabTex: string | null;
  tabFile: string | null;
  tabFilename: string | null;
  soundsliceHash: string | null;
  trackTitle: string;
  trackNumber: number;
  previewUrl: string | null;
  appleMusicId: string | null;
  albumId: string;
  albumTitle: string;
  artworkUrl: string | null;
  artistName: string;
  itunesCollectionId: string | null;
  parts: TrackParts;
};

function pickCoverAlbum(albums: LibraryAlbum[]) {
  return [...albums].sort((a, b) => {
    if (b.tabCount !== a.tabCount) return b.tabCount - a.tabCount;
    return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
  })[0];
}

function queryLibrary(userId: string, instrument?: Instrument): LibraryArtist[] {
  const db = getDb();
  const rows = db
    .select({
      artistId: artists.id,
      artistName: artists.name,
      albumId: albums.id,
      albumTitle: albums.title,
      artworkUrl: albums.artworkUrl,
      releaseYear: albums.releaseYear,
      itunesCollectionId: albums.itunesCollectionId,
      tabId: tabs.id,
      instrument: tabs.instrument,
    })
    .from(tabs)
    .innerJoin(tracks, eq(tabs.trackId, tracks.id))
    .innerJoin(albums, eq(tracks.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(eq(tabs.userId, userId))
    .all()
    .filter((row) => !instrument || row.instrument === instrument);

  const byArtist = new Map<string, LibraryArtist>();

  for (const row of rows) {
    let artist = byArtist.get(row.artistId);
    if (!artist) {
      artist = {
        id: row.artistId,
        name: row.artistName,
        albums: [],
        coverAlbum: {
          id: row.albumId,
          title: row.albumTitle,
          artworkUrl: row.artworkUrl,
          releaseYear: row.releaseYear,
          tabCount: 0,
          itunesCollectionId: row.itunesCollectionId,
        },
      };
      byArtist.set(row.artistId, artist);
    }

    const existingAlbum = artist.albums.find((album) => album.id === row.albumId);
    if (existingAlbum) {
      existingAlbum.tabCount += 1;
    } else {
      artist.albums.push({
        id: row.albumId,
        title: row.albumTitle,
        artworkUrl: row.artworkUrl,
        releaseYear: row.releaseYear,
        tabCount: 1,
        itunesCollectionId: row.itunesCollectionId,
      });
    }
  }

  return [...byArtist.values()]
    .map((artist) => ({
      ...artist,
      albums: [...artist.albums].sort(
        (a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0) || a.title.localeCompare(b.title),
      ),
      coverAlbum: pickCoverAlbum(artist.albums),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function hydrateShelf(userId: string) {
  const shelf = await readShelfParts();
  for (const part of shelf) {
    try {
      const hydrated = await ensureItunesAlbum(part.collectionId);
      if (!hydrated) continue;
      if (part.trackNumber) {
        const track = hydrated.tracks.find((item) => item.trackNumber === part.trackNumber);
        if (track) {
          ensureUserTab(userId, track.id, track.title, hydrated.artistName, part.instrument);
        }
        continue;
      }
      for (const track of hydrated.tracks) {
        ensureUserTab(userId, track.id, track.title, hydrated.artistName, "guitar");
      }
    } catch (error) {
      console.error(error);
    }
  }
}

function queryLibrarySongs(userId: string, instrument: Instrument): LibrarySong[] {
  const db = getDb();
  return db
    .select({
      tabId: tabs.id,
      trackId: tracks.id,
      title: tracks.title,
      trackNumber: tracks.trackNumber,
      previewUrl: tracks.previewUrl,
      appleMusicId: tracks.appleMusicId,
      albumId: albums.id,
      albumTitle: albums.title,
      artworkUrl: albums.artworkUrl,
      artistName: artists.name,
      itunesCollectionId: albums.itunesCollectionId,
      instrument: tabs.instrument,
    })
    .from(tabs)
    .innerJoin(tracks, eq(tabs.trackId, tracks.id))
    .innerJoin(albums, eq(tracks.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(and(eq(tabs.userId, userId), eq(tabs.instrument, instrument)))
    .all()
    .map((row) => ({ ...row, instrument: parseInstrument(row.instrument) }))
    .sort(
      (a, b) =>
        a.artistName.localeCompare(b.artistName) ||
        a.albumTitle.localeCompare(b.albumTitle) ||
        a.trackNumber - b.trackNumber,
    );
}

export async function getLibrary(userId: string, instrument?: Instrument): Promise<LibraryArtist[]> {
  await hydrateShelf(userId);
  return queryLibrary(userId, instrument);
}

export async function getLibrarySongs(userId: string, instrument: Instrument): Promise<LibrarySong[]> {
  await hydrateShelf(userId);
  return queryLibrarySongs(userId, instrument);
}

export async function getArtistLibrary(artistId: string, userId: string, instrument?: Instrument) {
  const library = await getLibrary(userId, instrument);
  return library.find((artist) => artist.id === artistId) ?? null;
}

export async function getAlbumWithTracks(albumId: string, userId: string) {
  const collectionId = parseItunesAlbumId(albumId);
  if (collectionId) {
    await ensureItunesAlbum(collectionId);
  }

  const db = getDb();
  const album =
    db
      .select({
        id: albums.id,
        title: albums.title,
        artworkUrl: albums.artworkUrl,
        releaseYear: albums.releaseYear,
        itunesCollectionId: albums.itunesCollectionId,
        artistId: artists.id,
        artistName: artists.name,
      })
      .from(albums)
      .innerJoin(artists, eq(albums.artistId, artists.id))
      .where(eq(albums.id, albumId))
      .get() ??
    (collectionId
      ? db
          .select({
            id: albums.id,
            title: albums.title,
            artworkUrl: albums.artworkUrl,
            releaseYear: albums.releaseYear,
            itunesCollectionId: albums.itunesCollectionId,
            artistId: artists.id,
            artistName: artists.name,
          })
          .from(albums)
          .innerJoin(artists, eq(albums.artistId, artists.id))
          .where(eq(albums.itunesCollectionId, String(collectionId)))
          .get()
      : undefined);

  if (!album) return null;

  const albumTracks = db
    .select({
      id: tracks.id,
      title: tracks.title,
      trackNumber: tracks.trackNumber,
      previewUrl: tracks.previewUrl,
      appleMusicId: tracks.appleMusicId,
    })
    .from(tracks)
    .where(eq(tracks.albumId, album.id))
    .all()
    .sort((a, b) => a.trackNumber - b.trackNumber);

  const partRows = db
    .select({
      trackId: tabs.trackId,
      tabId: tabs.id,
      instrument: tabs.instrument,
    })
    .from(tabs)
    .innerJoin(tracks, eq(tabs.trackId, tracks.id))
    .where(and(eq(tracks.albumId, album.id), eq(tabs.userId, userId)))
    .all();

  const partsByTrack = new Map<string, TrackParts>();
  for (const row of partRows) {
    const parts = partsByTrack.get(row.trackId) ?? emptyParts();
    const instrument = parseInstrument(row.instrument);
    parts[instrument] = row.tabId;
    partsByTrack.set(row.trackId, parts);
  }

  return {
    album,
    tracks: albumTracks.map((track) => ({
      ...track,
      parts: partsByTrack.get(track.id) ?? emptyParts(),
    })),
  };
}

function tabSelect() {
  return {
    id: tabs.id,
    trackId: tracks.id,
    instrument: tabs.instrument,
    songsterrId: tabs.songsterrId,
    songsterrUrl: tabs.songsterrUrl,
    tabTex: tabs.tabTex,
    tabFile: tabs.tabFile,
    tabFilename: tabs.tabFilename,
    soundsliceHash: tabs.soundsliceHash,
    trackTitle: tracks.title,
    trackNumber: tracks.trackNumber,
    previewUrl: tracks.previewUrl,
    appleMusicId: tracks.appleMusicId,
    albumId: albums.id,
    albumTitle: albums.title,
    artworkUrl: albums.artworkUrl,
    artistName: artists.name,
    itunesCollectionId: albums.itunesCollectionId,
  };
}

function partsForTrack(trackId: string, userId: string): TrackParts {
  const db = getDb();
  const rows = db
    .select({ id: tabs.id, instrument: tabs.instrument })
    .from(tabs)
    .where(and(eq(tabs.trackId, trackId), eq(tabs.userId, userId)))
    .all();
  const parts = emptyParts();
  for (const row of rows) {
    parts[parseInstrument(row.instrument)] = row.id;
  }
  return parts;
}

function getTabById(tabId: string, userId: string) {
  const db = getDb();
  const row = db
    .select(tabSelect())
    .from(tabs)
    .innerJoin(tracks, eq(tabs.trackId, tracks.id))
    .innerJoin(albums, eq(tracks.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(and(eq(tabs.id, tabId), eq(tabs.userId, userId)))
    .get();
  if (!row) return null;
  return {
    ...row,
    instrument: parseInstrument(row.instrument),
    tabTex: row.tabTex ?? placeholderAlphaTex(row.trackTitle, row.artistName, parseInstrument(row.instrument)),
    parts: partsForTrack(row.trackId, userId),
  } satisfies TabView;
}

function getTabByTrack(trackId: string, userId: string, instrument: Instrument) {
  const db = getDb();
  const row = db
    .select(tabSelect())
    .from(tabs)
    .innerJoin(tracks, eq(tabs.trackId, tracks.id))
    .innerJoin(albums, eq(tracks.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(and(eq(tabs.trackId, trackId), eq(tabs.userId, userId), eq(tabs.instrument, instrument)))
    .get();
  if (!row) return null;
  return {
    ...row,
    instrument: parseInstrument(row.instrument),
    tabTex: row.tabTex ?? placeholderAlphaTex(row.trackTitle, row.artistName, parseInstrument(row.instrument)),
    parts: partsForTrack(row.trackId, userId),
  } satisfies TabView;
}

export async function getTabForUser(tabId: string, userId: string): Promise<TabView | null> {
  const parsed = parseItunesTabId(tabId);
  if (parsed) {
    const hydrated = await ensureItunesAlbum(parsed.collectionId);
    if (!hydrated) return null;
    const track = hydrated.tracks.find((item) => item.trackNumber === parsed.trackNumber);
    if (!track) return null;
    ensureUserTab(userId, track.id, track.title, hydrated.artistName, parsed.instrument);
    return getTabByTrack(track.id, userId, parsed.instrument);
  }

  return getTabById(tabId, userId);
}
