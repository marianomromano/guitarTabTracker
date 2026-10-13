export type ItunesAlbumOption = {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl: string | null;
  releaseYear: number | null;
  trackCount: number;
};

export type ItunesTrack = {
  trackName: string;
  trackNumber: number;
  discNumber: number;
  previewUrl: string | null;
  appleMusicId: string | null;
};

type ItunesResult = {
  wrapperType?: string;
  kind?: string;
  artistId?: number;
  artistName?: string;
  collectionId?: number;
  collectionName?: string;
  trackName?: string;
  trackNumber?: number;
  discNumber?: number;
  trackCount?: number;
  releaseDate?: string;
  artworkUrl100?: string;
  previewUrl?: string;
  trackId?: number;
};

function hiResArtwork(url: string | undefined) {
  if (!url) return null;
  return url.replace(/100x100bb/g, "600x600bb").replace(/100x100/g, "600x600");
}

function yearFromDate(value: string | undefined) {
  if (!value) return null;
  const year = Number(value.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

export function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/\[.*?\]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function titlesMatch(a: string, b: string) {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

async function itunesJson(url: URL) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    throw new Error(`iTunes lookup failed (${response.status})`);
  }
  const data = (await response.json()) as { results?: ItunesResult[] };
  return data.results ?? [];
}

function isSameArtist(albumArtist: string, queryArtist: string) {
  return normalizeTitle(albumArtist) === normalizeTitle(queryArtist);
}

function isLikelyStudioAlbum(name: string, trackCount: number) {
  if (trackCount < 1 || trackCount > 20) return false;
  return !/\b(live|tribute|mix|dj mix|cover|covers|rendition|karaoke|lullaby|complete|box set|anthology|greatest|hits|mothership|sessions|collection)\b/i.test(
    name,
  );
}

export async function searchItunesAlbums(
  artist: string,
  title: string,
): Promise<ItunesAlbumOption[]> {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", `${artist} ${title}`);
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", "25");

  const results = await itunesJson(url);
  const albums = new Map<number, ItunesAlbumOption>();

  for (const result of results) {
    if (result.kind !== "song" || !result.collectionId || !result.collectionName) {
      continue;
    }
    if (result.trackName && !titlesMatch(result.trackName, title)) {
      continue;
    }
    if (albums.has(result.collectionId)) continue;

    albums.set(result.collectionId, {
      collectionId: result.collectionId,
      collectionName: result.collectionName,
      artistName: result.artistName ?? artist,
      artworkUrl: hiResArtwork(result.artworkUrl100),
      releaseYear: yearFromDate(result.releaseDate),
      trackCount: result.trackCount ?? 0,
    });
  }

  const all = [...albums.values()];
  const byArtist = all.filter((album) => isSameArtist(album.artistName, artist));
  const studio = byArtist.filter((album) =>
    isLikelyStudioAlbum(album.collectionName, album.trackCount),
  );
  return (studio.length ? studio : byArtist.length ? byArtist : all).slice(0, 8);
}

export async function lookupItunesAlbum(collectionId: number) {
  const url = new URL("https://itunes.apple.com/lookup");
  url.searchParams.set("id", String(collectionId));
  url.searchParams.set("entity", "song");

  const results = await itunesJson(url);
  const collection = results.find((item) => item.wrapperType === "collection");
  const songs = results.filter((item) => item.kind === "song" && item.trackName);

  const album: ItunesAlbumOption = {
    collectionId,
    collectionName: collection?.collectionName ?? songs[0]?.collectionName ?? "Unknown Album",
    artistName: collection?.artistName ?? songs[0]?.artistName ?? "Unknown Artist",
    artworkUrl: hiResArtwork(collection?.artworkUrl100 ?? songs[0]?.artworkUrl100),
    releaseYear: yearFromDate(collection?.releaseDate ?? songs[0]?.releaseDate),
    trackCount: collection?.trackCount ?? songs.length,
  };

  const tracks: ItunesTrack[] = songs
    .map((song) => ({
      trackName: song.trackName ?? "Untitled",
      trackNumber: song.trackNumber ?? 0,
      discNumber: song.discNumber ?? 1,
      previewUrl: song.previewUrl ?? null,
      appleMusicId: song.trackId ? String(song.trackId) : null,
    }))
    .sort((a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber);

  return { album, tracks, artistId: collection?.artistId ?? songs[0]?.artistId };
}

export async function searchItunesSong(artist: string, title: string, albumTitle?: string) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", `${artist} ${title} ${albumTitle ?? ""}`.trim());
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", "10");

  const results = await itunesJson(url);
  const match =
    results.find(
      (result) =>
        result.kind === "song" &&
        result.trackName &&
        titlesMatch(result.trackName, title),
    ) ?? results.find((result) => result.kind === "song");

  return {
    previewUrl: match?.previewUrl ?? null,
    appleMusicId: match?.trackId ? String(match.trackId) : null,
  };
}

export async function searchItunesPreview(artist: string, title: string, albumTitle?: string) {
  const song = await searchItunesSong(artist, title, albumTitle);
  return song.previewUrl;
}
