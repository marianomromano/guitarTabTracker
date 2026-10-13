"use client";

import { useState } from "react";
import { Minus, Plus, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMetronome } from "@/hooks/use-metronome";
import { usePlayer } from "@/components/player-provider";
import { cn } from "@/lib/utils";

export function MetronomeControls() {
  const { track, playing, getPlaybackTime } = usePlayer();
  const [enabled, setEnabled] = useState(false);
  const { bpm, detecting, pulse, nudge } = useMetronome({
    enabled,
    playing,
    previewUrl: track?.previewUrl ?? null,
    trackId: track?.id ?? null,
    getPlaybackTime,
  });

  return (
    <div className="mt-2 flex items-center gap-2">
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
            aria-label="Slow metronome"
            onClick={() => nudge(-1)}
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
            aria-label="Speed metronome"
            onClick={() => nudge(1)}
          >
            <Plus />
          </Button>
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
