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
import type { ItunesAlbumOption, ItunesSongOption } from "@/lib/itunes";

export function AddTabButton({ song }: { song: ItunesSongOption }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [albums, setAlbums] = useState<ItunesAlbumOption[] | null>(null);

  function save(collectionId?: number) {
    setError(null);
    startTransition(async () => {
      const result = await addTabAction({
        title: song.trackName,
        artist: song.artistName,
        collectionId: collectionId ?? song.collectionId,
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
      <Button
        size="sm"
        onClick={() => save()}
        disabled={pending}
        className="w-full bg-gold text-black hover:bg-gold/90 sm:w-auto"
      >
        {pending ? "Adding tabs..." : "Add album tabs"}
      </Button>
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
