"use client";

import { useState } from "react";
import { Minus, Plus, Timer, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMetronome } from "@/hooks/use-metronome";
import { usePlayer } from "@/components/player-provider";
import { cn } from "@/lib/utils";

const BPM_STEP = 5;

export function MetronomeControls() {
  const { track, playing, getPlaybackTime } = usePlayer();
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const { bpm, detecting, pulse, nudge } = useMetronome({
    enabled,
    playing,
    previewUrl: track?.previewUrl ?? null,
    trackId: track?.id ?? null,
    volume,
    getPlaybackTime,
  });

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="icon-sm"
        variant={enabled ? "default" : "outline"}
        className={cn(
          "size-11 rounded-full md:size-11",
          enabled ? "bg-gold text-black hover:bg-gold/90" : "border-white/15",
        )}
        aria-pressed={enabled}
        aria-label={enabled ? "Turn metronome off" : "Turn metronome on"}
        onClick={() => setEnabled((current) => !current)}
      >
        <Timer className="size-5" />
      </Button>
      {enabled ? (
        <>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            className="size-11 border-white/15 md:size-11"
            aria-label="Slow metronome by 5 BPM"
            onClick={() => nudge(-BPM_STEP)}
          >
            <Minus />
          </Button>
          <span
            className={cn(
              "min-w-16 text-center font-mono text-sm tabular-nums",
              pulse ? "text-gold" : "text-foreground",
            )}
          >
            {detecting && !bpm ? "…" : `${bpm ?? "—"} BPM`}
          </span>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            className="size-11 border-white/15 md:size-11"
            aria-label="Speed metronome by 5 BPM"
            onClick={() => nudge(BPM_STEP)}
          >
            <Plus />
          </Button>
          <label className="flex items-center gap-2 text-muted-foreground">
            <Volume2 className="size-4" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="h-2 w-24 accent-[var(--gold)]"
              aria-label="Metronome volume"
            />
          </label>
          <span
            aria-hidden
            className={cn(
              "size-2.5 rounded-full bg-white/20 transition",
              pulse && "scale-125 bg-gold",
            )}
          />
        </>
      ) : (
        <span className="text-xs text-muted-foreground">Metronome</span>
      )}
    </div>
  );
}
