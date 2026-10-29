"use client";

import { useState, useTransition } from "react";
import { attachSoundsliceAction, uploadTabFileAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AttachTabForm({
  trackId,
  instrument = "guitar",
  filename,
  soundsliceHash,
  hasAlphaTab = false,
}: {
  trackId: string;
  artistName: string;
  trackTitle: string;
  instrument?: string;
  filename: string | null;
  soundsliceHash: string | null;
  hasAlphaTab?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sliceUrl, setSliceUrl] = useState(soundsliceHash ?? "");

  return (
    <div className="rounded-xl bg-card px-4 py-3 ring-1 ring-border">
      <p className="text-sm text-muted-foreground">
        {filename || hasAlphaTab
          ? `Showing ${filename ?? "this tab"} in alphaTab.`
          : soundsliceHash
            ? "Showing the Soundslice embed."
            : "Optional: paste a Soundslice link, or use Upload tab above."}
      </p>
      {hasAlphaTab || filename ? (
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            const file = new FormData(event.currentTarget).get("file");
            if (!(file instanceof File) || file.size === 0) {
              setError("Choose a Guitar Pro, MusicXML, or alphaTex file.");
              return;
            }
            const data = new FormData();
            data.set("trackId", trackId);
            data.set("instrument", instrument);
            data.set("file", file);
            setError(null);
            startTransition(async () => {
              const result = await uploadTabFileAction(data);
              if (!result.ok) setError(result.error);
            });
          }}
        >
          <Input
            type="file"
            name="file"
            accept=".gp,.gp3,.gp4,.gp5,.gpx,.gpb,.xml,.musicxml,.tex,.alphatex,.txt"
          />
          <Button type="submit" disabled={pending} className="bg-gold text-black hover:bg-gold/90">
            {pending ? "Saving…" : "Replace tab"}
          </Button>
        </form>
      ) : null}
      <form
        className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await attachSoundsliceAction({ trackId, url: sliceUrl, instrument });
            if (!result.ok) setError(result.error);
          });
        }}
      >
        <Input
          value={sliceUrl}
          onChange={(event) => setSliceUrl(event.target.value)}
          placeholder="https://www.soundslice.com/slices/…"
        />
        <Button type="submit" variant="outline" disabled={pending} className="border-border">
          Embed Soundslice
        </Button>
      </form>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
