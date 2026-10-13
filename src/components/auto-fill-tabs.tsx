"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fillMissingAlbumTabsAction } from "@/app/actions";

export function AutoFillTabs({ albumId, missing }: { albumId: string; missing: number }) {
  const router = useRouter();
  const started = useRef(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!missing || started.current) return;
    started.current = true;
    setWorking(true);
    void fillMissingAlbumTabsAction(albumId)
      .then(() => router.refresh())
      .finally(() => setWorking(false));
  }, [albumId, missing, router]);

  if (!working) return null;

  return (
    <p className="mt-3 text-sm text-gold">Finding tabs for the rest of this album…</p>
  );
}
