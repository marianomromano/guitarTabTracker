"use client";

import Link from "next/link";
import { useState } from "react";
import { Guitar, Link2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkTabDialog } from "@/components/link-tab-dialog";
import { PlayButton } from "@/components/play-button";

type TrackRow = {
  id: string;
  title: string;
  trackNumber: number;
  previewUrl: string | null;
  appleMusicId?: string | null;
  tabId: string | null;
  songsterrId?: number | null;
  tabFilename?: string | null;
  soundsliceHash?: string | null;
};

export function TrackList({
  tracks,
  artistName,
  artworkUrl,
  collectionId,
}: {
  tracks: TrackRow[];
  artistName: string;
  artworkUrl: string | null;
  collectionId?: string | null;
}) {
  const [activeTrack, setActiveTrack] = useState<TrackRow | null>(null);

  return (
    <>
      <ol className="overflow-hidden rounded-xl ring-1 ring-white/10">
        {tracks.map((track) => {
          const tabHref = collectionId
            ? `/tab/itunes-${collectionId}-${track.trackNumber}`
            : track.tabId
              ? `/tab/${track.tabId}`
              : null;
          return (
            <li
              key={track.id}
              className="flex items-stretch gap-1 border-b border-white/5 last:border-b-0"
            >
              <div className="flex items-center pl-2">
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
              {tabHref ? (
                <Link
                  href={tabHref}
                  className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-3 py-3.5 text-sm text-zinc-100 transition active:bg-white/10 hover:bg-white/5"
                >
                  <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground">
                    {String(track.trackNumber).padStart(2, "0")}
                  </span>
                  <span className="flex-1 truncate">{track.title}</span>
                  <Guitar className="size-5 shrink-0 text-gold md:size-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTrack(track)}
                  className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-3 py-3.5 text-left text-sm opacity-40 transition active:bg-white/10 active:opacity-80 hover:bg-white/5 hover:opacity-70"
                >
                  <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground">
                    {String(track.trackNumber).padStart(2, "0")}
                  </span>
                  <span className="flex-1 truncate">{track.title}</span>
                  <Link2 className="size-5 shrink-0 md:size-4" />
                </button>
              )}
              {track.tabId ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="my-auto mr-2"
                  onClick={() => setActiveTrack(track)}
                  aria-label={`Change tab for ${track.title}`}
                >
                  <Pencil />
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>
      {activeTrack ? (
        <LinkTabDialog
          open
          onOpenChange={(open) => {
            if (!open) setActiveTrack(null);
          }}
          trackId={activeTrack.id}
          trackTitle={activeTrack.title}
          artistName={artistName}
          currentSongsterrId={activeTrack.songsterrId}
        />
      ) : null}
    </>
  );
}
