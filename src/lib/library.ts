import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { albums, artists, tabs, tracks } from "@/db/schema";

export type LibraryAlbum = {
  id: string;
  title: string;
  artworkUrl: string | null;
  releaseYear: number | null;
  tabCount: number;
};

export type LibraryArtist = {
  id: string;
  name: string;
  albums: LibraryAlbum[];
  coverAlbum: LibraryAlbum;
};

function pickCoverAlbum(albums: LibraryAlbum[]) {
  return [...albums].sort((a, b) => {
    if (b.tabCount !== a.tabCount) return b.tabCount - a.tabCount;
    return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
  })[0];
}

export function getLibrary(userId: string): LibraryArtist[] {
  const db = getDb();
  const rows = db
    .select({
      artistId: artists.id,
      artistName: artists.name,
      albumId: albums.id,
      albumTitle: albums.title,
      artworkUrl: albums.artworkUrl,
      releaseYear: albums.releaseYear,
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

export function getArtistLibrary(artistId: string, userId: string) {
  return getLibrary(userId).find((artist) => artist.id === artistId) ?? null;
}

export function getAlbumWithTracks(albumId: string, userId: string) {
  const db = getDb();
  const album = db
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
    .get();

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
    .where(eq(tracks.albumId, albumId))
    .all()
    .sort((a, b) => a.trackNumber - b.trackNumber);

  return { album, tracks: albumTracks };
}

export function getTabForUser(tabId: string, userId: string) {
  const db = getDb();
  return db
    .select({
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
    })
    .from(tabs)
    .innerJoin(tracks, eq(tabs.trackId, tracks.id))
    .innerJoin(albums, eq(tracks.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(and(eq(tabs.id, tabId), eq(tabs.userId, userId)))
    .get();
}
