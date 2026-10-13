"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const FONT_DIR = "https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.8.4/dist/font/";
const SOUND_FONT =
  "https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.8.4/dist/soundfont/sonivox.sf2";

type AlphaTabApi = {
  tex: (value: string) => void;
  load: (data: ArrayBuffer) => void;
  playPause: () => void;
  destroy: () => void;
  playerReady: { on: (handler: () => void) => void };
  playerStateChanged: { on: (handler: (args: { state: number }) => void) => void };
  renderFinished: { on: (handler: () => void) => void };
  error: { on: (handler: (err: unknown) => void) => void };
};

export function AlphaTabViewer({
  tex,
  fileBase64,
}: {
  tex?: string | null;
  fileBase64?: string | null;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<AlphaTabApi | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || (!tex && !fileBase64)) return;
    let cancelled = false;

    void import("@coderline/alphatab").then((alphaTab) => {
      if (cancelled || !hostRef.current) return;
      host.innerHTML = "";
      const api = new alphaTab.AlphaTabApi(host, {
        core: {
          fontDirectory: FONT_DIR,
          useWorkers: false,
        },
        player: {
          enablePlayer: true,
          soundFont: SOUND_FONT,
          scrollElement: host.parentElement ?? host,
        },
        display: {
          resources: {
            staffLineColor: "#737373",
            barSeparatorColor: "#737373",
            mainGlyphColor: "#f4f0e7",
            secondaryGlyphColor: "#d4d4d8",
            scoreInfoColor: "#f4f0e7",
            barNumberColor: "#c9a24a",
          },
        },
      }) as AlphaTabApi;

      api.error?.on((loadError) => {
        console.error(loadError);
        setError("Could not render that tab file.");
      });
      api.renderFinished?.on(() => setReady(true));
      api.playerReady.on(() => setReady(true));
      api.playerStateChanged.on((args) => setPlaying(args.state === 1));
      apiRef.current = api;

      try {
        if (fileBase64) {
          const binary = atob(fileBase64);
          const bytes = new Uint8Array(binary.length);
          for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
          }
          api.load(bytes.buffer);
        } else if (tex) {
          api.tex(tex);
        }
      } catch (loadError) {
        console.error(loadError);
        setError("Could not render that tab file.");
      }
    });

    return () => {
      cancelled = true;
      apiRef.current?.destroy();
      apiRef.current = null;
    };
  }, [fileBase64, tex]);

  return (
    <div className="flex min-h-[22rem] flex-1 flex-col overflow-hidden rounded-2xl bg-black/25 ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Embedded tab</p>
        <Button
          type="button"
          size="sm"
          className="bg-gold text-black hover:bg-gold/90"
          disabled={!ready}
          onClick={() => apiRef.current?.playPause()}
        >
          {playing ? <Pause /> : <Play />}
          {playing ? "Pause tab" : "Play tab"}
        </Button>
      </div>
      {error ? <p className="px-4 py-3 text-sm text-destructive">{error}</p> : null}
      <div ref={hostRef} className="min-h-[20rem] flex-1 overflow-auto px-3 py-4" />
    </div>
  );
}
