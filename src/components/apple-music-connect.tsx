"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/components/player-provider";

export function AppleMusicConnect() {
  const { musicConfigured, musicAuthorized, authorizeAppleMusic } = usePlayer();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!musicConfigured) {
    return (
      <p className="text-sm text-muted-foreground">
        Add your Apple MusicKit keys to play full songs. Until then, play uses a 30-second preview.
      </p>
    );
  }

  if (musicAuthorized) {
    return <p className="text-sm text-muted-foreground">Apple Music is connected. Play starts the full song.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        className="border-white/15"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError(null);
          void authorizeAppleMusic()
            .then((ok) => {
              if (!ok) setError("Could not connect Apple Music.");
            })
            .catch(() => setError("Could not connect Apple Music."))
            .finally(() => setBusy(false));
        }}
      >
        {busy ? "Connecting…" : "Connect Apple Music"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Needed for full songs. Play still starts a preview if you skip this.
      </p>
      {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
