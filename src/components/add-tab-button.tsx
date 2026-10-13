"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Guitar } from "lucide-react";
import { addTabAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  INSTRUMENT_LABEL,
  INSTRUMENTS,
  type Instrument,
} from "@/lib/instrument";
import type { ItunesAlbumOption, ItunesSongOption } from "@/lib/itunes";
import { cn } from "@/lib/utils";

function addLabel(instruments: Instrument[]) {
  if (instruments.length === 3) return "Add guitar, bass & drums";
  if (instruments.length === 2) {
    return `Add ${INSTRUMENT_LABEL[instruments[0]].toLowerCase()} & ${INSTRUMENT_LABEL[instruments[1]].toLowerCase()}`;
  }
  return `Add ${INSTRUMENT_LABEL[instruments[0]].toLowerCase()} tab`;
}

export function AddTabButton({ song }: { song: ItunesSongOption }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [albums, setAlbums] = useState<ItunesAlbumOption[] | null>(null);
  const [instruments, setInstruments] = useState<Instrument[]>(["guitar"]);

  function toggleInstrument(instrument: Instrument) {
    setInstruments((current) => {
      if (current.includes(instrument)) {
        const next = current.filter((item) => item !== instrument);
        return next.length ? next : current;
      }
      return INSTRUMENTS.filter((item) => item === instrument || current.includes(item));
    });
  }

  function save(collectionId?: number) {
    setError(null);
    startTransition(async () => {
      const result = await addTabAction({
        title: song.trackName,
        artist: song.artistName,
        collectionId: collectionId ?? song.collectionId,
        instruments,
      });

      if (result.ok) {
        setAlbums(null);
        router.push(result.tabHref);
        router.refresh();
        return;
      }

      if ("needsAlbumPick" in result && result.needsAlbumPick) {
        setAlbums(result.albums);
        return;
      }

      setError("error" in result ? result.error : "Could not add that tab.");
    });
  }

  return (
    <>
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <div className="flex justify-end gap-1">
          {INSTRUMENTS.map((instrument) => {
            const selected = instruments.includes(instrument);
            return (
              <button
                key={instrument}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleInstrument(instrument)}
                className={cn(
                  "min-h-8 rounded-md px-2.5 text-xs font-medium",
                  selected
                    ? "bg-gold text-black"
                    : "text-muted-foreground ring-1 ring-white/15 hover:text-foreground",
                )}
              >
                {INSTRUMENT_LABEL[instrument]}
              </button>
            );
          })}
        </div>
        <Button
          size="sm"
          onClick={() => save()}
          disabled={pending}
          className="w-full bg-gold text-black hover:bg-gold/90 sm:w-auto"
        >
          {pending ? "Adding…" : addLabel(instruments)}
        </Button>
      </div>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}

      <Dialog open={Boolean(albums)} onOpenChange={(open) => !open && setAlbums(null)}>
        <DialogContent className="max-w-lg bg-[#171410] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose an album</DialogTitle>
            <DialogDescription>
              Multiple albums include {song.trackName}. Pick the one that belongs on your shelf.
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[60vh] gap-2 overflow-y-auto">
            {albums?.map((album) => (
              <button
                key={album.collectionId}
                type="button"
                disabled={pending}
                onClick={() => save(album.collectionId)}
                className="flex min-h-16 items-center gap-3 rounded-lg p-3 text-left active:bg-white/10 hover:bg-white/5"
              >
                {album.artworkUrl ? (
                  <Image
                    src={album.artworkUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 rounded-sm object-cover"
                  />
                ) : (
                  <span className="flex size-12 items-center justify-center rounded-sm bg-muted">
                    <Guitar className="size-4" />
                  </span>
                )}
                <span>
                  <span className="block text-sm">{album.collectionName}</span>
                  <span className="text-xs text-muted-foreground">
                    {album.artistName}
                    {album.releaseYear ? ` · ${album.releaseYear}` : ""}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
