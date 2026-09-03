"use client";

import { useState } from "react";
import Link from "next/link";
import { Guitar, Link2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkTabDialog } from "@/components/link-tab-dialog";

type TrackRow = {
  id: string;
  title: string;
  trackNumber: number;
  tabId: string | null;
  songsterrId: number | null;
};

export function TrackList({
  tracks,
  artistName,
}: {
  tracks: TrackRow[];
  artistName: string;
}) {
  const [activeTrack, setActiveTrack] = useState<TrackRow | null>(null);

  return (
    <>
      <ol className="overflow-hidden rounded-xl ring-1 ring-white/10">
        {tracks.map((track) => {
          const hasTab = Boolean(track.tabId);
          return (
            <li
              key={track.id}
              className="flex items-center gap-1 border-b border-white/5 last:border-b-0"
            >
              {hasTab && track.tabId ? (
                <Link
                  href={`/tab/${track.tabId}`}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-sm text-zinc-100 transition hover:bg-white/5"
                >
                  <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground">
                    {String(track.trackNumber).padStart(2, "0")}
                  </span>
                  <span className="flex-1 truncate">{track.title}</span>
                  <Guitar className="size-4 shrink-0 text-gold" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTrack(track)}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left text-sm opacity-40 transition hover:bg-white/5 hover:opacity-70"
                >
                  <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground">
                    {String(track.trackNumber).padStart(2, "0")}
                  </span>
                  <span className="flex-1 truncate">{track.title}</span>
                  <Link2 className="size-4 shrink-0" />
                </button>
              )}
              {hasTab ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mr-2"
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
