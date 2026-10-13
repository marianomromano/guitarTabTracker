"use client";

import { useState, useTransition } from "react";
import { attachSoundsliceAction, uploadTabFileAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function LinkTabDialog({
  open,
  onOpenChange,
  trackId,
  trackTitle,
  artistName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  trackTitle: string;
  artistName: string;
  currentSongsterrId?: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sliceUrl, setSliceUrl] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#171410] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach a tab</DialogTitle>
          <DialogDescription>
            Upload a Guitar Pro file for {trackTitle} by {artistName}, or paste a Soundslice URL.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const file = new FormData(event.currentTarget).get("file");
            if (!(file instanceof File) || file.size === 0) {
              setError("Choose a tab file first.");
              return;
            }
            const data = new FormData();
            data.set("trackId", trackId);
            data.set("file", file);
            setError(null);
            startTransition(async () => {
              const result = await uploadTabFileAction(data);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              onOpenChange(false);
            });
          }}
        >
          <Input type="file" name="file" accept=".gp,.gp3,.gp4,.gp5,.gpx,.gpb,.xml,.musicxml,.tex,.alphatex,.txt" />
          <Button type="submit" disabled={pending} className="bg-gold text-black hover:bg-gold/90">
            {pending ? "Saving…" : "Upload and embed"}
          </Button>
        </form>
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            startTransition(async () => {
              const result = await attachSoundsliceAction({ trackId, url: sliceUrl });
              if (!result.ok) {
                setError(result.error);
                return;
              }
              onOpenChange(false);
            });
          }}
        >
          <Input
            value={sliceUrl}
            onChange={(event) => setSliceUrl(event.target.value)}
            placeholder="Soundslice slice URL"
          />
          <Button type="submit" variant="outline" disabled={pending} className="border-white/15">
            Embed Soundslice
          </Button>
        </form>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
