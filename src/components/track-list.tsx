"use client";

import { useState } from "react";
import { PartButtons } from "@/components/part-buttons";
import { PlayButton } from "@/components/play-button";
import { SongInstrumentPicker, type PickerSong } from "@/components/song-instrument-picker";
import { type Instrument, type InstrumentParts } from "@/lib/instrument";

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
  albumTitle,
  artworkUrl,
  collectionId,
  returnTo = "/library",
}: {
  tracks: TrackRow[];
  artistName: string;
  albumTitle?: string;
  artworkUrl: string | null;
  collectionId?: string | null;
  returnTo?: string;
}) {
  const [rows, setRows] = useState(tracks);
  const [picked, setPicked] = useState<PickerSong | null>(null);

  const [previousInput, setPreviousInput] = useState(tracks);
  if (previousInput !== tracks) {
    setPreviousInput(tracks);
    setRows(tracks);
  }

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
    <>
      <ol className="overflow-hidden rounded-xl ring-1 ring-border">
        {rows.map((track) => (
          <li
            key={track.id}
            className="flex items-stretch gap-1 border-b border-border last:border-b-0"
          >
            <div className="flex items-center py-1.5 pl-2">
              <PlayButton
                track={{
                  id: track.id,
                  title: track.title,
                  artist: artistName,
                  albumTitle,
                  artworkUrl,
                  previewUrl: track.previewUrl,
                  appleMusicId: track.appleMusicId,
                }}
              />
            </div>
            <button
              type="button"
              onClick={() =>
                setPicked({
                  id: track.id,
                  title: track.title,
                  artist: artistName,
                  albumTitle,
                  artworkUrl,
                  previewUrl: track.previewUrl,
                  appleMusicId: track.appleMusicId,
                  trackNumber: track.trackNumber,
                  collectionId,
                })
              }
              className="flex min-h-16 min-w-0 flex-1 items-center gap-3 px-3 py-3.5 text-left text-sm text-foreground transition active:bg-accent hover:bg-accent/50"
            >
              <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground">
                {String(track.trackNumber).padStart(2, "0")}
              </span>
              <span className="flex-1 truncate">{track.title}</span>
            </button>
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
        ))}
      </ol>
      <SongInstrumentPicker song={picked} onClose={() => setPicked(null)} />
    </>
  );
}
