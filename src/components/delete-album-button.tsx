"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteAlbumAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export function DeleteAlbumButton({ albumId, albumTitle }: { albumId: string; albumTitle: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <AlertDialog open={open} onOpenChange={value => { if (!pending) { setOpen(value); setError(null); } }}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="mt-5 h-16 w-full gap-2 text-base text-destructive md:h-16"><Trash2 />Delete album</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {albumTitle}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes all guitar, bass, and drum parts for this album from your shelf, including uploaded tabs and attached links. Other accounts keep their copies. You can add the album again, but your attachments will need to be added again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending} className="h-14 md:h-14">Cancel</AlertDialogCancel>
          <Button disabled={pending} aria-busy={pending} className="h-14 bg-destructive text-white hover:bg-destructive/90 md:h-14" onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                const result = await deleteAlbumAction(albumId);
                if (!result.ok) { setError(result.error); return; }
                setOpen(false);
                router.replace("/library");
                router.refresh();
              } catch { setError("Could not delete that album. Try again."); }
            });
          }}>{pending ? "Deleting…" : "Delete album"}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
