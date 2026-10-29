"use client";

import { useState, useTransition } from "react";
import { Pause, Play } from "lucide-react";
import { resolveTrackMediaAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { usePlayer, type PlayableTrack } from "@/components/player-provider";
import { cn } from "@/lib/utils";

export function PlayButton({
  track,
  size = "icon-lg",
}: {
  track: Omit<PlayableTrack, "previewUrl" | "appleMusicId"> & {
    previewUrl: string | null;
    appleMusicId?: string | null;
  };
  size?: "icon-sm" | "icon" | "icon-lg" | "lg";
}) {
  const { track: current, playing, play, toggle } = usePlayer();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);
  const active = current?.id === track.id;

  function start() {
    setError(false);
    if (active) {
      toggle();
      return;
    }
    if (track.previewUrl) {
      void play({
        ...track,
        previewUrl: track.previewUrl,
        appleMusicId: track.appleMusicId ?? null,
      });
      return;
    }
    startTransition(async () => {
      const media = await resolveTrackMediaAction(track.id);
      if (!media?.previewUrl) {
        setError(true);
        return;
      }
      await play({
        ...track,
        previewUrl: media.previewUrl,
        appleMusicId: media.appleMusicId ?? track.appleMusicId ?? null,
      });
    });
  }

  return (
    <span className="inline-flex flex-col items-center">
      <Button
        type="button"
        size={size === "lg" ? "lg" : "icon-lg"}
        variant={active ? "default" : "outline"}
        className={cn(
          active ? "bg-gold text-black hover:bg-gold/90" : "border-border",
          size === "lg"
            ? "h-14 min-w-14 gap-2 px-5 text-base md:h-14 [&_svg]:size-6"
            : "size-14 rounded-full md:size-14 [&_svg]:size-7",
        )}
        onClick={start}
        disabled={pending}
        aria-label={active && playing ? `Pause ${track.title}` : `Play ${track.title}`}
      >
        {active && playing ? <Pause /> : <Play />}
        {size === "lg" ? (pending ? "Loading…" : active && playing ? "Pause" : "Play song") : null}
      </Button>
      {error ? <span className="mt-1 text-[10px] text-destructive">No song found</span> : null}
    </span>
  );
}
