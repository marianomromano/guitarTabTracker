"use client";

import { useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TabStage({
  songsterrUrl,
  title,
}: {
  songsterrUrl: string;
  title: string;
}) {
  useEffect(() => {
    const key = `tabshelf-tab:${songsterrUrl}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    window.open(songsterrUrl, "_blank", "noopener,noreferrer");
  }, [songsterrUrl]);

  return (
    <div className="flex min-h-[22rem] flex-1 flex-col items-center justify-center gap-4 rounded-2xl bg-black/25 px-6 py-16 text-center ring-1 ring-white/10">
      <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Guitar tab</p>
      <p className="max-w-md text-sm text-muted-foreground text-pretty">
        Songsterr blocks tabs inside other apps, so {title} opens in a new window. Keep this page
        playing the song and read the tab next to it.
      </p>
      <Button asChild size="lg" className="h-12 bg-gold text-black hover:bg-gold/90">
        <a href={songsterrUrl} target="_blank" rel="noopener noreferrer">
          Show the tab
          <ExternalLink />
        </a>
      </Button>
    </div>
  );
}
