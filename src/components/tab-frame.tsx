"use client";

import { useEffect, useState } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TabFrame({ src, title }: { src: string; title: string }) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(false);
    const timer = window.setTimeout(() => setShowHint(true), 1200);
    return () => window.clearTimeout(timer);
  }, [src]);

  return (
    <div className="relative min-h-0 flex-1 bg-black">
      <iframe
        src={src}
        title={title}
        className="h-full w-full border-0 bg-black"
        referrerPolicy="no-referrer-when-downgrade"
        allow="autoplay; fullscreen; clipboard-read; clipboard-write"
      />
      {showHint ? (
        <div className="absolute inset-x-0 top-0 z-10 p-3 sm:p-4">
          <div className="mx-auto flex max-w-xl items-start gap-2 rounded-lg bg-[#171410]/95 px-3 py-2 text-xs text-muted-foreground ring-1 ring-white/10">
            <p className="flex-1 text-center sm:text-left">
              Songsterr often blocks its player inside other apps. If this panel
              is blank, use Open on Songsterr in the header. Back still returns
              to the album.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowHint(false)}
              aria-label="Dismiss"
            >
              <XIcon />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
