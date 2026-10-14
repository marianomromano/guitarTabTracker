import { NextResponse } from "next/server";
import { titlesMatch } from "@/lib/itunes";
import { parsePlainLyrics, parseSyncedLyrics, type LyricsResult } from "@/lib/lyrics";

export const dynamic = "force-dynamic";

const LRCLIB = "https://lrclib.net";
const CLIENT = "TabShelf/0.1.0 (https://guitar-tab-tracker.vercel.app)";

type LrclibTrack = {
  trackName?: string;
  artistName?: string;
  instrumental?: boolean;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
};

function emptyLyrics(): LyricsResult {
  return { instrumental: false, source: "none", lines: [] };
}

function toResult(hit: LrclibTrack | null | undefined): LyricsResult {
  if (!hit) return emptyLyrics();
  if (hit.instrumental && !hit.syncedLyrics && !hit.plainLyrics) {
    return { instrumental: true, source: "none", lines: [] };
  }
  if (hit.syncedLyrics) {
    const lines = parseSyncedLyrics(hit.syncedLyrics);
    if (lines.length) return { instrumental: false, source: "synced", lines };
  }
  if (hit.plainLyrics) {
    const lines = parsePlainLyrics(hit.plainLyrics);
    if (lines.length) return { instrumental: false, source: "plain", lines };
  }
  return emptyLyrics();
}

function scoreHit(hit: LrclibTrack, title: string, artist: string) {
  let score = 0;
  if (hit.trackName && titlesMatch(hit.trackName, title)) score += 4;
  if (hit.artistName && titlesMatch(hit.artistName, artist)) score += 4;
  if (hit.syncedLyrics) score += 3;
  else if (hit.plainLyrics) score += 1;
  if (hit.instrumental) score += 0.5;
  return score;
}

async function lrclibJson(url: URL) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": CLIENT,
      "Lrclib-Client": CLIENT,
    },
    next: { revalidate: 86400 },
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Lyrics lookup failed (${response.status})`);
  }
  return response.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.trim() ?? "";
  const artist = searchParams.get("artist")?.trim() ?? "";

  if (!title || !artist) {
    return NextResponse.json(emptyLyrics());
  }

  try {
    const search = new URL("/api/search", LRCLIB);
    search.searchParams.set("track_name", title);
    search.searchParams.set("artist_name", artist);
    const hits = (await lrclibJson(search)) as LrclibTrack[] | null;
    const ranked = [...(hits ?? [])].sort(
      (left, right) => scoreHit(right, title, artist) - scoreHit(left, title, artist),
    );
    const best = ranked.find((hit) => hit.syncedLyrics || hit.plainLyrics || hit.instrumental) ?? ranked[0];
    if (best) {
      return NextResponse.json(toResult(best));
    }

    const exact = new URL("/api/get", LRCLIB);
    exact.searchParams.set("track_name", title);
    exact.searchParams.set("artist_name", artist);
    const hit = (await lrclibJson(exact)) as LrclibTrack | null;
    return NextResponse.json(toResult(hit));
  } catch (error) {
    console.error(error);
    return NextResponse.json(emptyLyrics(), { status: 502 });
  }
}
