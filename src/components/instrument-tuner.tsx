"use client";

import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INSTRUMENTS, type InstrumentPreset, type TunerString } from "@/lib/tuner";
import { useTuner } from "@/hooks/use-tuner";

export function InstrumentTuner() {
  const [instrumentId, setInstrumentId] = useState<InstrumentPreset["id"]>("guitar");
  const [lockedId, setLockedId] = useState<string | null>(null);
  const instrument = INSTRUMENTS.find((item) => item.id === instrumentId) ?? INSTRUMENTS[0];
  const lockedString = instrument.strings.find((string) => string.id === lockedId) ?? null;
  const { status, error, reading, level, start, stop } = useTuner(instrument, lockedString);
  const listening = status === "listening";
  const cents = reading?.cents ?? 0;
  const needle = Math.max(-50, Math.min(50, cents));
  const inTune = Boolean(reading?.inTune);
  const hearing = level > 0.0012;

  function selectInstrument(next: InstrumentPreset["id"]) {
    setInstrumentId(next);
    setLockedId(null);
  }

  function toggleString(string: TunerString) {
    setLockedId((current) => (current === string.id ? null : string.id));
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center">
      <div className="flex flex-wrap justify-center gap-2">
        {INSTRUMENTS.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            size="sm"
            variant={preset.id === instrument.id ? "default" : "outline"}
            className={
              preset.id === instrument.id
                ? "bg-gold text-black hover:bg-gold/90"
                : "border-white/15"
            }
            onClick={() => selectInstrument(preset.id)}
          >
            {preset.name}
          </Button>
        ))}
      </div>

      <div
        className="mt-10 flex w-full flex-col items-center rounded-3xl border border-white/8 bg-black/25 px-5 py-10"
        data-tuner-status={status}
        data-tuner-level={level.toFixed(4)}
        data-tuner-note={reading?.string.note ?? ""}
      >
        <p className="text-[11px] tracking-[0.28em] text-gold uppercase">
          {listening ? "Listening" : "Ready"}
        </p>
        <p
          className={cn(
            "font-heading mt-3 text-7xl leading-none sm:text-8xl",
            inTune ? "text-gold" : "text-foreground",
          )}
          aria-live="polite"
        >
          {reading ? reading.string.note.replace(/\d+$/, "") : "—"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {reading
            ? `${reading.string.note} · ${reading.frequency.toFixed(1)} Hz`
            : listening
              ? hearing
                ? "Pluck an open string"
                : "Mic is on, but no sound yet — play closer to the phone"
              : "Start the tuner, then pluck a string"}
        </p>
        <div
          className="mt-5 h-1.5 w-40 overflow-hidden rounded-full bg-white/10"
          aria-hidden="true"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width,background-color] duration-75",
              hearing ? "bg-gold" : "bg-white/35",
            )}
            style={{ width: `${Math.min(100, level * 1400)}%` }}
          />
        </div>

        <div className="relative mt-8 h-16 w-full max-w-md">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/15" />
          <div className="absolute top-1/2 left-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-gold" />
          <div
            className={cn(
              "absolute top-2 h-12 w-12 -translate-x-1/2 rounded-full border-2 transition-transform duration-75",
              inTune ? "border-gold bg-gold/20" : "border-white/40 bg-[#171410]",
            )}
            style={{ left: `${50 + needle}%` }}
          />
          <p className="absolute -bottom-1 left-0 text-[10px] tracking-widest text-muted-foreground uppercase">
            Flat
          </p>
          <p className="absolute -bottom-1 right-0 text-[10px] tracking-widest text-muted-foreground uppercase">
            Sharp
          </p>
        </div>
        <p
          className={cn(
            "mt-6 text-sm font-medium",
            reading ? (inTune ? "text-gold" : "text-foreground") : "text-muted-foreground",
          )}
        >
          {!reading
            ? "—"
            : inTune
              ? "In tune"
              : `${cents > 0 ? "+" : ""}${Math.round(cents)} cents`}
        </p>
      </div>

      <div className="mt-8 grid w-full grid-cols-3 gap-2 sm:grid-cols-6">
        {instrument.strings.map((string) => {
          const active = (lockedString ?? reading?.string)?.id === string.id;
          return (
            <button
              key={string.id}
              type="button"
              onClick={() => toggleString(string)}
              className={cn(
                "min-h-16 rounded-xl border px-2 py-4 text-center transition active:scale-[0.98]",
                active
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground",
              )}
            >
              <span className="block text-[10px] tracking-[0.2em] uppercase">
                String {string.label}
              </span>
              <span className="font-heading mt-1 block text-lg text-foreground">{string.note}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Auto-detects the closest string. Tap one to lock it.
      </p>

      <div className="mt-8 w-full max-w-xs">
        {listening ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full border-white/15"
            onClick={stop}
          >
            <MicOff />
            Stop listening
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            className="w-full bg-gold text-black hover:bg-gold/90"
            onClick={start}
          >
            <Mic />
            Start tuner
          </Button>
        )}
      </div>
      {error ? <p className="mt-3 text-center text-sm text-destructive">{error}</p> : null}
      <p className="mt-6 max-w-md text-center text-xs text-muted-foreground text-pretty">
        Use a quiet room and hold the guitar or bass near the mic. Low 5-string bass notes can be
        hard for laptop microphones.
      </p>
    </div>
  );
}
