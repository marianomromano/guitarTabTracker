"use client";

import Image from "next/image";
import Link from "next/link";
import { PlayButton } from "@/components/play-button";
import { partTabHref } from "@/lib/ids";
import type { LibrarySong } from "@/lib/library";

export function LibrarySongs({ songs }: { songs: LibrarySong[] }) {
  const groups = groupByArtist(songs);

  return (
    <div className="grid gap-8">
      {groups.map((group) => (
        <section key={group.artistName}>
          <h2 className="mb-3 font-heading text-xl">{group.artistName}</h2>
          <ol className="overflow-hidden rounded-xl ring-1 ring-white/10">
            {group.songs.map((song) => {
              const href = partTabHref(
                song.itunesCollectionId,
                song.trackNumber,
                song.instrument,
                song.tabId,
              );
              return (
                <li
                  key={song.tabId}
                  className="flex items-stretch gap-1 border-b border-white/5 last:border-b-0"
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
                        artworkUrl: song.artworkUrl,
                        previewUrl: song.previewUrl,
                        appleMusicId: song.appleMusicId,
                      }}
                    />
                  </div>
                  <Link
                    href={href}
                    className="flex min-h-16 min-w-0 flex-1 flex-col justify-center px-3 py-3 text-zinc-100 transition active:bg-white/10 hover:bg-white/5"
                  >
                    <span className="truncate text-base font-medium">{song.title}</span>
                    <span className="truncate text-sm text-muted-foreground">{song.albumTitle}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
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
