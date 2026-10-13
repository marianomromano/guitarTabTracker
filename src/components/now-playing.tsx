"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { MetronomeControls } from "@/components/metronome-controls";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/player-provider";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function NowPlaying() {
  const {
    track,
    playing,
    progress,
    duration,
    source,
    musicConfigured,
    musicAuthorized,
    toggle,
    seek,
    authorizeAppleMusic,
  } = usePlayer();

  if (!track) return null;

  const label =
    source === "apple"
      ? "Apple Music"
      : musicConfigured && !musicAuthorized
        ? "Preview · connect Apple Music for the full song"
        : "Apple preview";

  return (
    <div
      data-now-playing
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-white/10 bg-[#171410]/95 px-4 py-3 backdrop-blur-md md:bottom-0"
    >
      <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
        {track.artworkUrl ? (
          <Image
            src={track.artworkUrl}
            alt=""
            width={56}
            height={56}
            className="size-14 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="size-14 shrink-0 rounded-md bg-muted" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{track.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {track.artist} · {label}
          </p>
          <input
            type="range"
            min={0}
            max={duration || 30}
            step={0.1}
            value={Math.min(progress, duration || 30)}
            onChange={(event) => seek(Number(event.target.value))}
            className="mt-1.5 h-1.5 w-full accent-[var(--gold)]"
            aria-label="Song position"
          />
          <MetronomeControls />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {musicConfigured && !musicAuthorized ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/15"
              onClick={() => void authorizeAppleMusic()}
            >
              Connect Apple Music
            </Button>
          ) : null}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="icon-lg"
              className="size-14 rounded-full bg-gold text-black hover:bg-gold/90 md:size-14 [&_svg]:size-7"
              onClick={toggle}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause /> : <Play />}
            </Button>
            <p className="font-mono text-[10px] text-muted-foreground">
              {formatTime(progress)} / {formatTime(duration)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
