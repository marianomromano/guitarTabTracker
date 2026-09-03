import { AddTabButton } from "@/components/add-tab-button";
import { Badge } from "@/components/ui/badge";
import type { SongsterrSong } from "@/lib/songsterr";

export function SearchResults({
  query,
  results,
}: {
  query: string;
  results: SongsterrSong[];
}) {
  if (!query) {
    return (
      <p className="text-muted-foreground">
        Search for a song or artist to add tabs to your shelf.
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="text-muted-foreground">No tabs found for “{query}”.</p>
    );
  }

  return (
    <ul className="divide-y divide-white/5 overflow-hidden rounded-xl ring-1 ring-white/10">
      {results.map((song) => (
        <li key={song.id} className="flex items-start justify-between gap-4 p-4">
          <div>
            <p className="font-medium">{song.title}</p>
            <p className="text-sm text-muted-foreground">{song.artist}</p>
            {song.instruments.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {song.instruments.map((type) => (
                  <Badge key={type} variant="secondary">
                    {type}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          <AddTabButton song={song} />
        </li>
      ))}
    </ul>
  );
}
