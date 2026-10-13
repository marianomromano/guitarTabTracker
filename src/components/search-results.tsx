import { AddTabButton } from "@/components/add-tab-button";
import type { ItunesSongOption } from "@/lib/itunes";

export function SearchResults({
  query,
  results,
}: {
  query: string;
  results: ItunesSongOption[];
}) {
  if (!query) {
    return (
      <p className="text-muted-foreground">
        Search for a song, then add guitar, bass, or drums for that track.
      </p>
    );
  }

  if (results.length === 0) {
    return <p className="text-muted-foreground">No songs found for “{query}”.</p>;
  }

  return (
    <ul className="divide-y divide-white/5 overflow-hidden rounded-xl ring-1 ring-white/10">
      {results.map((song) => (
        <li
          key={song.trackId}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="font-medium">{song.trackName}</p>
            <p className="text-sm text-muted-foreground">
              {song.artistName} · {song.collectionName}
            </p>
          </div>
          <AddTabButton song={song} />
        </li>
      ))}
    </ul>
  );
}
