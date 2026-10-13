import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { albums, artists, tabs, tracks } from "@/db/schema";
import { placeholderAlphaTex } from "@/lib/alphatex";
import { ensureItunesAlbum } from "@/lib/hydrate";
import { parseItunesAlbumId, parseItunesTabId } from "@/lib/ids";
import { readShelfCollectionIds } from "@/lib/shelf";

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

export type TabView = {
  id: string;
  trackId: string;
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
};

function pickCoverAlbum(albums: LibraryAlbum[]) {
  return [...albums].sort((a, b) => {
    if (b.tabCount !== a.tabCount) return b.tabCount - a.tabCount;
    return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
  })[0];
}

function queryLibrary(userId: string): LibraryArtist[] {
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
    })
    .from(tabs)
    .innerJoin(tracks, eq(tabs.trackId, tracks.id))
    .innerJoin(albums, eq(tracks.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(eq(tabs.userId, userId))
    .all();

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

export async function getLibrary(userId: string): Promise<LibraryArtist[]> {
  const shelf = await readShelfCollectionIds();
  for (const collectionId of shelf) {
    try {
      await ensureItunesAlbum(collectionId, userId);
    } catch (error) {
      console.error(error);
    }
  }
  return queryLibrary(userId);
}

export async function getArtistLibrary(artistId: string, userId: string) {
  const library = await getLibrary(userId);
  return library.find((artist) => artist.id === artistId) ?? null;
}

export async function getAlbumWithTracks(albumId: string, userId: string) {
  const collectionId = parseItunesAlbumId(albumId);
  if (collectionId) {
    await ensureItunesAlbum(collectionId, userId);
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
      tabId: tabs.id,
      songsterrId: tabs.songsterrId,
      tabFilename: tabs.tabFilename,
      soundsliceHash: tabs.soundsliceHash,
    })
    .from(tracks)
    .leftJoin(tabs, and(eq(tabs.trackId, tracks.id), eq(tabs.userId, userId)))
    .where(eq(tracks.albumId, album.id))
    .all()
    .sort((a, b) => a.trackNumber - b.trackNumber);

  return { album, tracks: albumTracks };
}

function tabViewFromRow(row: {
  id: string;
  trackId: string;
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
}): TabView {
  return {
    ...row,
    tabTex: row.tabTex ?? placeholderAlphaTex(row.trackTitle, row.artistName),
  };
}

export async function getTabForUser(tabId: string, userId: string): Promise<TabView | null> {
  const parsed = parseItunesTabId(tabId);
  if (parsed) {
    const hydrated = await ensureItunesAlbum(parsed.collectionId, userId);
    if (!hydrated) return null;
    const track = hydrated.tracks.find((item) => item.trackNumber === parsed.trackNumber);
    if (!track) return null;
    return getTabByTrack(track.id, userId);
  }

  return getTabById(tabId, userId);
}

function tabSelect() {
  return {
    id: tabs.id,
    trackId: tracks.id,
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
  return row ? tabViewFromRow(row) : null;
}

function getTabByTrack(trackId: string, userId: string) {
  const db = getDb();
  const row = db
    .select(tabSelect())
    .from(tabs)
    .innerJoin(tracks, eq(tabs.trackId, tracks.id))
    .innerJoin(albums, eq(tracks.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(and(eq(tabs.trackId, trackId), eq(tabs.userId, userId)))
    .get();
  return row ? tabViewFromRow(row) : null;
}
