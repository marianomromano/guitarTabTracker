"use client";

import { useState } from "react";
import Image from "next/image";
import { PartButtons } from "@/components/part-buttons";
import { PlayButton } from "@/components/play-button";
import { SongInstrumentPicker, type PickerSong } from "@/components/song-instrument-picker";
import { StrataCoreKitHint } from "@/components/strata-core-kit";
import { emptyParts } from "@/lib/instrument";
import type { LibrarySong } from "@/lib/library";

export function LibrarySongs({ songs }: { songs: LibrarySong[] }) {
  const [hidden, setHidden] = useState<Record<string, true>>({});
  const [picked, setPicked] = useState<PickerSong | null>(null);
  const groups = groupByArtist(songs.filter((song) => !hidden[song.tabId]));

  if (groups.length === 0) {
    return <p className="text-muted-foreground">No songs in this list.</p>;
  }

  return (
    <div className="grid gap-8">
      {groups.map((group) => (
        <section key={group.artistName}>
          <div className="mb-3">
            <h2 className="font-heading text-xl">{group.artistName}</h2>
            <StrataCoreKitHint artistName={group.artistName} compact />
          </div>
          <ol className="overflow-hidden rounded-xl ring-1 ring-border">
            {group.songs.map((song) => {
              const parts = { ...emptyParts(), [song.instrument]: song.tabId };
              return (
                <li
                  key={song.tabId}
                  className="flex items-stretch gap-1 border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-3 py-2 pl-2">
                    {song.artworkUrl ? (
                      <Image
                        src={song.artworkUrl}
                        alt=""
                        width={48}
                        height={48}
                        className="size-12 shrink-0 rounded-sm object-cover"
                      />
                    ) : (
                      <span className="size-12 shrink-0 rounded-sm bg-muted" />
                    )}
                    <PlayButton
                      track={{
                        id: song.trackId,
                        title: song.title,
                        artist: song.artistName,
                        albumTitle: song.albumTitle,
                        artworkUrl: song.artworkUrl,
                        previewUrl: song.previewUrl,
                        appleMusicId: song.appleMusicId,
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPicked({
                        id: song.trackId,
                        title: song.title,
                        artist: song.artistName,
                        albumTitle: song.albumTitle,
                        artworkUrl: song.artworkUrl,
                        previewUrl: song.previewUrl,
                        appleMusicId: song.appleMusicId,
                        trackNumber: song.trackNumber,
                        collectionId: song.itunesCollectionId,
                        tabId: song.tabId,
                      })
                    }
                    className="flex min-h-16 min-w-0 flex-1 flex-col justify-center px-3 py-3 text-left text-foreground transition active:bg-accent hover:bg-accent/50"
                  >
                    <span className="truncate text-base font-medium">{song.title}</span>
                    <span className="truncate text-sm text-muted-foreground">{song.albumTitle}</span>
                  </button>
                  <div className="flex items-center pr-3">
                    <PartButtons
                      trackId={song.trackId}
                      parts={parts}
                      active={song.instrument}
                      returnTo={`/library?part=${song.instrument}`}
                      onRemoved={(instrument) => {
                        if (instrument === song.instrument) {
                          setHidden((current) => ({ ...current, [song.tabId]: true }));
                        }
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      <SongInstrumentPicker song={picked} onClose={() => setPicked(null)} />
    </div>
  );
}

function groupByArtist(songs: LibrarySong[]) {
  const groups: { artistName: string; songs: LibrarySong[] }[] = [];
  for (const song of songs) {
    const current = groups[groups.length - 1];
    if (current?.artistName === song.artistName) {
      current.songs.push(song);
    } else {
      groups.push({ artistName: song.artistName, songs: [song] });
    }
  }
  return groups;
}
