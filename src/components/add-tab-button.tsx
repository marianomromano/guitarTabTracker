"use client";

import { useState } from "react";
import { StrataCoreKitHint } from "@/components/strata-core-kit";
import { Button } from "@/components/ui/button";
import { INSTRUMENT_LABEL, INSTRUMENTS } from "@/lib/instrument";
import type { ItunesSongOption } from "@/lib/itunes";
import { cn } from "@/lib/utils";

export function AddTabButton({
  song,
  returnTo,
}: {
  song: ItunesSongOption;
  returnTo: string;
}) {
  const [drumsSelected, setDrumsSelected] = useState(false);
  return (
    <form action="/api/add-tab" method="post" className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      <input type="hidden" name="title" value={song.trackName} />
      <input type="hidden" name="artist" value={song.artistName} />
      <input type="hidden" name="collectionId" value={String(song.collectionId)} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="flex flex-wrap justify-end gap-2">
        {INSTRUMENTS.map((instrument) => (
          <label key={instrument} className="cursor-pointer">
            <input
              type="checkbox"
              name="instruments"
              value={instrument}
              defaultChecked={instrument === "guitar"}
              onChange={event => { if (instrument === "drums") setDrumsSelected(event.target.checked); }}
              className="peer sr-only"
            />
            <span
              className={cn(
                "inline-flex min-h-12 min-w-16 items-center justify-center rounded-lg px-3 text-base font-medium ring-1 ring-border peer-checked:bg-gold peer-checked:text-black peer-checked:ring-gold",
              )}
            >
              {INSTRUMENT_LABEL[instrument]}
            </span>
          </label>
        ))}
      </div>
      {drumsSelected ? <StrataCoreKitHint artistName={song.artistName} albumTitle={song.collectionName} compact showFallback /> : null}
      <Button
        type="submit"
        className="h-12 w-full bg-gold px-5 text-base text-black hover:bg-gold/90 sm:w-auto"
      >
        Add to shelf
      </Button>
    </form>
  );
}
