"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { linkTabToTrackAction, searchTabsAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { SongsterrSong } from "@/lib/songsterr";

export function LinkTabDialog({
  open,
  onOpenChange,
  trackId,
  trackTitle,
  artistName,
  currentSongsterrId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  trackTitle: string;
  artistName: string;
  currentSongsterrId?: number | null;
}) {
  const router = useRouter();
  const defaultQuery = `${artistName} ${trackTitle}`.trim();
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<SongsterrSong[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [linking, startLink] = useTransition();

  useEffect(() => {
    if (!open) return;
    const nextQuery = `${artistName} ${trackTitle}`.trim();
    setQuery(nextQuery);
    setError(null);
    startSearch(async () => {
      try {
        const songs = await searchTabsAction(nextQuery);
        setResults(songs);
      } catch {
        setError("Could not search Songsterr right now.");
        setResults([]);
      }
    });
  }, [open, trackId, artistName, trackTitle]);

  function runSearch(nextQuery: string) {
    startSearch(async () => {
      try {
        setError(null);
        const songs = await searchTabsAction(nextQuery);
        setResults(songs);
      } catch {
        setError("Could not search Songsterr right now.");
        setResults([]);
      }
    });
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    runSearch(query);
  }

  function choose(song: SongsterrSong) {
    startLink(async () => {
      const result = await linkTabToTrackAction({
        trackId,
        songsterrId: song.id,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#171410] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {currentSongsterrId ? "Change tab" : "Link a tab"}
          </DialogTitle>
          <DialogDescription>
            Pick a Songsterr tab for {trackTitle} by {artistName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Song or artist"
              className="bg-black/20 pl-8"
            />
          </div>
          <Button type="submit" disabled={searching} className="bg-gold text-black hover:bg-gold/90">
            {searching ? "Searching..." : "Search"}
          </Button>
        </form>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="grid max-h-[50vh] gap-1 overflow-y-auto">
          {searching && results.length === 0 ? (
            <p className="px-2 py-6 text-sm text-muted-foreground">Searching Songsterr...</p>
          ) : results.length === 0 ? (
            <p className="px-2 py-6 text-sm text-muted-foreground">No tabs found.</p>
          ) : (
            results.map((song) => {
              const selected = currentSongsterrId === song.id;
              return (
                <button
                  key={song.id}
                  type="button"
                  disabled={linking}
                  onClick={() => choose(song)}
                  className="flex items-start justify-between gap-3 rounded-lg p-2 text-left hover:bg-white/5 disabled:opacity-60"
                >
                  <span>
                    <span className="block text-sm">{song.title}</span>
                    <span className="text-xs text-muted-foreground">{song.artist}</span>
                    {song.instruments.length ? (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {song.instruments.map((instrument) => (
                          <Badge key={instrument} variant="secondary">
                            {instrument}
                          </Badge>
                        ))}
                      </span>
                    ) : null}
                  </span>
                  {selected ? (
                    <span className="shrink-0 text-xs text-gold">Current</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
