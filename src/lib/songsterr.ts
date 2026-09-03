export type SongsterrSong = {
  id: number;
  title: string;
  artist: string;
  instruments: string[];
};

type SongsterrApiSong = {
  songId: number;
  artist: string;
  title: string;
  tracks?: { instrument?: string }[];
};

export function songsterrViewUrl(id: number) {
  return `https://www.songsterr.com/a/wa/song?id=${id}`;
}

export async function searchSongsterr(query: string): Promise<SongsterrSong[]> {
  const pattern = query.trim();
  if (!pattern) return [];

  const url = new URL("https://www.songsterr.com/api/songs");
  url.searchParams.set("pattern", pattern);
  url.searchParams.set("size", "40");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "TabShelf/1.0",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Songsterr search failed (${response.status})`);
  }

  const data = (await response.json()) as SongsterrApiSong[];
  if (!Array.isArray(data)) return [];

  return data.map((song) => ({
    id: song.songId,
    title: song.title,
    artist: song.artist,
    instruments: [
      ...new Set(
        (song.tracks ?? [])
          .map((track) => track.instrument)
          .filter((name): name is string => Boolean(name)),
      ),
    ].slice(0, 4),
  }));
}
