"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, Pause, Play } from "lucide-react";
import { InstrumentSwitch, pickerSongFromTrack } from "@/components/instrument-switch";
import { StrataCoreKitHint } from "@/components/strata-core-kit";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/player-provider";
import { activeLyricIndex, type LyricsResult } from "@/lib/lyrics";
import { cn } from "@/lib/utils";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

const lyricsCache = new Map<string, LyricsResult>();

export function NowPlayingScreen({ onClose }: { onClose: () => void }) {
  const { track, playing, progress, duration, toggle, seek } = usePlayer();
  const key = track ? `${track.artist}::${track.title}` : "";
  const [result, setResult] = useState<{ key: string; lyrics: LyricsResult } | null>(null);
  const lyrics = (result?.key === key ? result.lyrics : lyricsCache.get(key)) ?? null;
  const loading = Boolean(track) && !lyrics;
  const activeRef = useRef<HTMLParagraphElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const active =
    lyrics?.source === "synced" ? activeLyricIndex(lyrics.lines, progress) : -1;

  useEffect(() => {
    if (!track) return;

    if (lyricsCache.has(key)) return;

    const controller = new AbortController();
    let cancelled = false;
    void fetch(
      `/api/lyrics?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}`,
      { signal: controller.signal },
    )
      .then((response) => response.json())
      .then((data: LyricsResult) => {
        if (cancelled) return;
        lyricsCache.set(key, data);
        setResult({ key, lyrics: data });
      })
      .catch((error: unknown) => {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) return;
        setResult({ key, lyrics: { instrumental: false, source: "none", lines: [] } });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [track, key]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    if (lyrics?.source !== "plain" || !scrollerRef.current || duration <= 0) return;
    const node = scrollerRef.current;
    const max = node.scrollHeight - node.clientHeight;
    if (max <= 0) return;
    node.scrollTo({ top: (progress / duration) * max, behavior: "smooth" });
  }, [duration, lyrics?.source, progress]);

  if (!track) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Now playing"
      className="fixed inset-0 z-[70] flex flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex shrink-0 items-center gap-3 px-4 py-3">
        <Button
          type="button"
          size="icon-lg"
          variant="ghost"
          onClick={onClose}
          aria-label="Close now playing"
          className="text-foreground"
        >
          <ChevronDown />
        </Button>
        <p className="text-[11px] tracking-[0.28em] text-primary uppercase">Now playing</p>
        <div className="ml-auto">
          <InstrumentSwitch song={pickerSongFromTrack(track)} active="drums" />
        </div>
      </div>

      <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 gap-6 overflow-hidden px-4 pb-6 md:grid-cols-[minmax(240px,0.85fr)_1.15fr]">
        <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto_auto_auto] gap-4">
          <div className="relative min-h-0">
            {track.artworkUrl ? (
              <Image
                src={track.artworkUrl}
                alt=""
                fill
                sizes="(min-width: 768px) 40vw, 80vw"
                priority
                className="rounded-2xl object-contain shadow-2xl"
              />
            ) : (
              <div className="absolute inset-0 rounded-2xl bg-muted" />
            )}
          </div>
          <div className="min-w-0 text-center md:text-left">
            <h1 className="font-heading text-3xl text-pretty">{track.title}</h1>
            <p className="mt-1 text-lg text-muted-foreground">{track.artist}</p>
            <div className="max-h-44 overflow-y-auto text-left"><StrataCoreKitHint artistName={track.artist} albumTitle={track.albumTitle} compact showFallback /></div>
          </div>
          <div>
            <input
              type="range"
              min={0}
              max={duration || 30}
              step={0.1}
              value={Math.min(progress, duration || 30)}
              onChange={(event) => seek(Number(event.target.value))}
              className="h-2 w-full accent-[var(--gold)]"
              aria-label="Song position"
            />
            <div className="mt-1 flex justify-between font-mono text-xs text-muted-foreground">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <Button
            type="button"
            size="lg"
            className="h-16 w-full gap-2 rounded-full bg-gold text-lg text-black hover:bg-gold/90 [&_svg]:size-7"
            onClick={toggle}
            aria-label={playing ? "Pause song" : "Play song"}
          >
            {playing ? <Pause /> : <Play />}
            {playing ? "Pause" : "Play"}
          </Button>
        </div>

        <div
          ref={scrollerRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl bg-card px-5 py-[30vh] ring-1 ring-border md:px-8"
        >
          {loading || !lyrics ? (
            <p className="text-center text-lg text-muted-foreground">Loading lyrics…</p>
          ) : lyrics.instrumental ? (
            <p className="text-center text-lg text-muted-foreground">This track is instrumental.</p>
          ) : lyrics.lines.length ? (
            lyrics.lines.map((line, index) => (
              <p
                key={`${line.time ?? "p"}-${index}`}
                ref={index === active ? activeRef : null}
                className={cn(
                  "py-2 text-2xl leading-snug text-pretty transition-colors duration-300 md:text-3xl",
                  lyrics.source === "synced"
                    ? index === active
                      ? "text-primary"
                      : "text-muted-foreground/70"
                    : "text-foreground",
                )}
              >
                {line.text || " "}
              </p>
            ))
          ) : (
            <p className="text-center text-lg text-muted-foreground">
              Lyrics are not available for this song.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
