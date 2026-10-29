"use client";

import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { MetronomeControls } from "@/components/metronome-controls";
import { NowPlayingScreen } from "@/components/now-playing-screen";
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
    nowPlayingOpen,
    openNowPlaying,
    closeNowPlaying,
  } = usePlayer();

  const label = !track
    ? "Nothing playing"
    : source === "apple"
      ? "Apple Music"
      : musicConfigured && !musicAuthorized
        ? "Preview · connect Apple Music in Settings"
        : "Apple preview";

  return (
    <>
      <div
        data-now-playing
        className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md md:bottom-0"
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <button
            type="button"
            disabled={!track}
            onClick={() => openNowPlaying()}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left disabled:opacity-100"
            aria-label={track ? `Open ${track.title}` : undefined}
          >
            {track?.artworkUrl ? (
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
              <p className="truncate text-sm font-medium">{track?.title ?? "No song selected"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {track ? `${track.artist} · ${label}` : label}
              </p>
            </div>
          </button>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Button
              type="button"
              size="lg"
              disabled={!track}
              className="h-14 min-w-28 gap-2 rounded-full bg-gold px-5 text-base text-black hover:bg-gold/90 disabled:opacity-40 [&_svg]:size-6"
              onClick={toggle}
              aria-label={playing ? "Pause song" : "Play song"}
            >
              {playing ? <Pause /> : <Play />}
              {playing ? "Pause" : "Play"}
            </Button>
            <p className="font-mono text-[10px] text-muted-foreground">
              {formatTime(track ? progress : 0)} / {formatTime(track ? duration : 0)}
            </p>
          </div>
        </div>
        <div className="mx-auto w-full max-w-3xl">
          <input
            type="range"
            min={0}
            max={duration || 30}
            step={0.1}
            value={track ? Math.min(progress, duration || 30) : 0}
            disabled={!track}
            onChange={(event) => seek(Number(event.target.value))}
            className="mt-1.5 h-1.5 w-full accent-[var(--gold)]"
            aria-label="Song position"
          />
          {track ? <MetronomeControls /> : null}
        </div>
      </div>
      {nowPlayingOpen && track ? <NowPlayingScreen onClose={closeNowPlaying} /> : null}
    </>
  );
}
