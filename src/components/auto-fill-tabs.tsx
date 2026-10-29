"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fillMissingAlbumTabsAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function AutoFillTabs({ albumId, missing }: { albumId: string; missing: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!missing) return null;

  return (
    <div className="mt-3">
      <Button
        type="button"
        variant="outline"
        className="border-border"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await fillMissingAlbumTabsAction(albumId);
            if (!result.ok) {
              setError("Could not add the remaining guitar tabs.");
              return;
            }
            router.refresh();
          });
        }}
      >
        {pending
          ? "Adding guitar tabs…"
          : `Add guitar tabs for ${missing} remaining ${missing === 1 ? "song" : "songs"}`}
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
