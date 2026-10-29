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
import { lookupItunesAlbum, searchItunesSong, titlesMatch } from "@/lib/itunes";

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

async function fillAlbumPreviewUrls<T extends { id: string; title: string; previewUrl: string | null; appleMusicId: string | null }>(
  album: { id: string; itunesCollectionId: string | null },
  albumTracks: T[],
): Promise<T[]> {
  if (albumTracks.every((track) => track.previewUrl)) return albumTracks;
  if (!album.itunesCollectionId) return albumTracks;

  try {
    const lookup = await lookupItunesAlbum(Number(album.itunesCollectionId));
    const db = await getDb();
    return await Promise.all(albumTracks.map(async (track) => {
      if (track.previewUrl && track.appleMusicId) return track;
      const match = lookup.tracks.find((item) => titlesMatch(item.trackName, track.title));
      if (!match?.previewUrl && !match?.appleMusicId) return track;
      const previewUrl = track.previewUrl ?? match.previewUrl;
      const appleMusicId = track.appleMusicId ?? match.appleMusicId;
      (await db.update(tracks)
        .set({ previewUrl, appleMusicId })
        .where(eq(tracks.id, track.id)));
      return { ...track, previewUrl, appleMusicId };
    }));
  } catch (error) {
    console.error(error);
    return albumTracks;
  }
}

async function fillSongPreviewUrls(songs: LibrarySong[]): Promise<LibrarySong[]> {
  const missing = songs.filter((song) => !song.previewUrl);
  if (missing.length === 0) return songs;

  const found = new Map<string, { previewUrl: string | null; appleMusicId: string | null }>();
  await Promise.all(
    missing.map(async (song) => {
      try {
        const media = await searchItunesSong(song.artistName, song.title, song.albumTitle);
        if (media.previewUrl || media.appleMusicId) {
          found.set(song.trackId, media);
        }
      } catch (error) {
        console.error(error);
      }
    }),
  );
  if (found.size === 0) return songs;

  const db = await getDb();
  return Promise.all(songs.map(async (song) => {
    const media = found.get(song.trackId);
    if (!media) return song;
    (await db.update(tracks)
      .set({
        previewUrl: media.previewUrl ?? song.previewUrl,
        appleMusicId: media.appleMusicId ?? song.appleMusicId,
      })
      .where(eq(tracks.id, song.trackId)));
    return {
      ...song,
      previewUrl: media.previewUrl ?? song.previewUrl,
      appleMusicId: media.appleMusicId ?? song.appleMusicId,
    };
  }));
}

function pickCoverAlbum(albums: LibraryAlbum[]) {
  return [...albums].sort((a, b) => {
    if (b.tabCount !== a.tabCount) return b.tabCount - a.tabCount;
    return (b.releaseYear ?? 0) - (a.releaseYear ?? 0);
  })[0];
}

async function queryLibrary(userId: string, instrument?: Instrument): Promise<LibraryArtist[]> {
  const db = await getDb();
  const rows = (await db
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
    .where(eq(tabs.userId, userId)))
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

async function queryLibrarySongs(userId: string, instrument: Instrument): Promise<LibrarySong[]> {
  const db = await getDb();
  return (await db
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
    .where(and(eq(tabs.userId, userId), eq(tabs.instrument, instrument))))
    .map((row) => ({ ...row, instrument: parseInstrument(row.instrument) }))
    .sort(
      (a, b) =>
        a.artistName.localeCompare(b.artistName) ||
        a.albumTitle.localeCompare(b.albumTitle) ||
        a.trackNumber - b.trackNumber,
    );
}

export async function getLibrary(userId: string, instrument?: Instrument): Promise<LibraryArtist[]> {
  return await queryLibrary(userId, instrument);
}

export async function getLibrarySongs(userId: string, instrument: Instrument): Promise<LibrarySong[]> {
  const songs = await queryLibrarySongs(userId, instrument);
  return fillSongPreviewUrls(songs);
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

  const db = await getDb();
  const album =
    (await db
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
      .where(eq(albums.id, albumId)).limit(1))[0] ??
    (collectionId
      ? (await db
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
          .where(eq(albums.itunesCollectionId, String(collectionId))).limit(1))[0]
      : undefined);

  if (!album) return null;

  const albumTracks = (await db
    .select({
      id: tracks.id,
      title: tracks.title,
      trackNumber: tracks.trackNumber,
      previewUrl: tracks.previewUrl,
      appleMusicId: tracks.appleMusicId,
    })
    .from(tracks)
    .where(eq(tracks.albumId, album.id)))
    .sort((a, b) => a.trackNumber - b.trackNumber);

  const albumTracksWithAudio = await fillAlbumPreviewUrls(album, albumTracks);

  const partRows = (await db
    .select({
      trackId: tabs.trackId,
      tabId: tabs.id,
      instrument: tabs.instrument,
    })
    .from(tabs)
    .innerJoin(tracks, eq(tabs.trackId, tracks.id))
    .where(and(eq(tracks.albumId, album.id), eq(tabs.userId, userId))));

  const partsByTrack = new Map<string, TrackParts>();
  for (const row of partRows) {
    const parts = partsByTrack.get(row.trackId) ?? emptyParts();
    const instrument = parseInstrument(row.instrument);
    parts[instrument] = row.tabId;
    partsByTrack.set(row.trackId, parts);
  }

  return {
    album,
    tracks: albumTracksWithAudio.map((track) => ({
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

async function partsForTrack(trackId: string, userId: string): Promise<TrackParts> {
  const db = await getDb();
  const rows = (await db
    .select({ id: tabs.id, instrument: tabs.instrument })
    .from(tabs)
    .where(and(eq(tabs.trackId, trackId), eq(tabs.userId, userId))));
  const parts = emptyParts();
  for (const row of rows) {
    parts[parseInstrument(row.instrument)] = row.id;
  }
  return parts;
}

async function getTabById(tabId: string, userId: string) {
  const db = await getDb();
  const row = (await db
    .select(tabSelect())
    .from(tabs)
    .innerJoin(tracks, eq(tabs.trackId, tracks.id))
    .innerJoin(albums, eq(tracks.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(and(eq(tabs.id, tabId), eq(tabs.userId, userId))).limit(1))[0];
  if (!row) return null;
  return {
    ...row,
    instrument: parseInstrument(row.instrument),
    tabTex: row.tabTex ?? placeholderAlphaTex(row.trackTitle, row.artistName, parseInstrument(row.instrument)),
    parts: await partsForTrack(row.trackId, userId),
  } satisfies TabView;
}

async function getTabByTrack(trackId: string, userId: string, instrument: Instrument) {
  const db = await getDb();
  const row = (await db
    .select(tabSelect())
    .from(tabs)
    .innerJoin(tracks, eq(tabs.trackId, tracks.id))
    .innerJoin(albums, eq(tracks.albumId, albums.id))
    .innerJoin(artists, eq(albums.artistId, artists.id))
    .where(and(eq(tabs.trackId, trackId), eq(tabs.userId, userId), eq(tabs.instrument, instrument))).limit(1))[0];
  if (!row) return null;
  return {
    ...row,
    instrument: parseInstrument(row.instrument),
    tabTex: row.tabTex ?? placeholderAlphaTex(row.trackTitle, row.artistName, parseInstrument(row.instrument)),
    parts: await partsForTrack(row.trackId, userId),
  } satisfies TabView;
}

export async function getTabForUser(tabId: string, userId: string): Promise<TabView | null> {
  const parsed = parseItunesTabId(tabId);
  if (parsed) {
    const hydrated = await ensureItunesAlbum(parsed.collectionId);
    if (!hydrated) return null;
    const track = hydrated.tracks.find((item) => item.trackNumber === parsed.trackNumber);
    if (!track) return null;
    await ensureUserTab(userId, track.id, track.title, hydrated.artistName, parsed.instrument);
    return getTabByTrack(track.id, userId, parsed.instrument);
  }

  return getTabById(tabId, userId);
}
