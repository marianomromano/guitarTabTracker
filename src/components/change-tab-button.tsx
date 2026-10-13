"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkTabDialog } from "@/components/link-tab-dialog";

export function ChangeTabButton({
  trackId,
  trackTitle,
  artistName,
  size = "default",
}: {
  trackId: string;
  trackTitle: string;
  artistName: string;
  currentSongsterrId?: number;
  size?: "default" | "sm";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size={size} onClick={() => setOpen(true)}>
        <Pencil />
        Change tab
      </Button>
      <LinkTabDialog
        open={open}
        onOpenChange={setOpen}
        trackId={trackId}
        trackTitle={trackTitle}
        artistName={artistName}
      />
    </>
  );
}
