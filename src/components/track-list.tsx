"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PartButtons } from "@/components/part-buttons";
import { PlayButton } from "@/components/play-button";
import { itunesTabPath } from "@/lib/ids";
import { primaryPart, type Instrument, type InstrumentParts } from "@/lib/instrument";

type TrackRow = {
  id: string;
  title: string;
  trackNumber: number;
  previewUrl: string | null;
  appleMusicId?: string | null;
  parts: InstrumentParts;
};

export function TrackList({
  tracks,
  artistName,
  artworkUrl,
  collectionId,
  returnTo = "/library",
}: {
  tracks: TrackRow[];
  artistName: string;
  artworkUrl: string | null;
  collectionId?: string | null;
  returnTo?: string;
}) {
  const [rows, setRows] = useState(tracks);

  useEffect(() => {
    setRows(tracks);
  }, [tracks]);

  function markPart(trackId: string, instrument: Instrument, tabId: string | null) {
    setRows((current) =>
      current.map((track) =>
        track.id === trackId
          ? { ...track, parts: { ...track.parts, [instrument]: tabId } }
          : track,
      ),
    );
  }

  return (
    <ol className="overflow-hidden rounded-xl ring-1 ring-white/10">
      {rows.map((track) => {
        const instrument = primaryPart(track.parts) ?? "guitar";
        const tabHref = collectionId
          ? itunesTabPath(Number(collectionId), track.trackNumber, instrument)
          : track.parts[instrument]
            ? `/tab/${track.parts[instrument]}`
            : `/tab/${track.id}-${instrument}`;
        return (
          <li
            key={track.id}
            className="flex items-stretch gap-1 border-b border-white/5 last:border-b-0"
          >
            <div className="flex items-center py-1.5 pl-2">
              <PlayButton
                track={{
                  id: track.id,
                  title: track.title,
                  artist: artistName,
                  artworkUrl,
                  previewUrl: track.previewUrl,
                  appleMusicId: track.appleMusicId,
                }}
              />
            </div>
            <Link
              href={tabHref}
              className="flex min-h-16 min-w-0 flex-1 items-center gap-3 px-3 py-3.5 text-sm text-zinc-100 transition active:bg-white/10 hover:bg-white/5"
            >
              <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground">
                {String(track.trackNumber).padStart(2, "0")}
              </span>
              <span className="flex-1 truncate">{track.title}</span>
            </Link>
            <div className="flex items-center pr-3">
              <PartButtons
                trackId={track.id}
                parts={track.parts}
                returnTo={returnTo}
                onSaved={(instrument, tabId) => markPart(track.id, instrument, tabId)}
                onRemoved={(instrument) => markPart(track.id, instrument, null)}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
