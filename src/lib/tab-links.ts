import type { Instrument } from "@/lib/instrument";

export function songsterrTabUrl(
  artist: string,
  title: string,
  storedUrl?: string | null,
) {
  if (storedUrl?.startsWith("http")) return storedUrl;
  const params = new URLSearchParams({ s: title, a: artist });
  return `https://www.songsterr.com/a/wa/bestMatchForQueryString?${params.toString()}`;
}

export function ultimateGuitarTabUrl(artist: string, title: string, instrument: Instrument = "guitar") {
  const query =
    instrument === "bass"
      ? `${title} ${artist} bass`
      : instrument === "drums"
        ? `${title} ${artist} drums`
        : `${title} ${artist}`;
  const params = new URLSearchParams({
    search_type: "title",
    value: query,
  });
  if (instrument === "bass") params.set("type", "400");
  return `https://www.ultimate-guitar.com/search.php?${params.toString()}`;
}
