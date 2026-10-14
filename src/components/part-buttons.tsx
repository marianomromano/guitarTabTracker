"use client";

import { useEffect, useState } from "react";
import {
  INSTRUMENT_LABEL,
  INSTRUMENT_LETTER,
  INSTRUMENTS,
  type Instrument,
  type InstrumentParts,
} from "@/lib/instrument";
import { cn } from "@/lib/utils";

export function PartButtons({
  trackId,
  parts,
  active,
  returnTo = "/library",
  onSaved,
  onRemoved,
}: {
  trackId: string;
  parts: InstrumentParts;
  collectionId?: string | null;
  trackNumber?: number;
  active?: Instrument;
  returnTo?: string;
  stayOnPage?: boolean;
  onSaved?: (instrument: Instrument, tabId: string) => void;
  onRemoved?: (instrument: Instrument) => void;
}) {
  const [saved, setSaved] = useState(parts);
  const [pending, setPending] = useState<Partial<Record<Instrument, boolean>>>({});

  useEffect(() => {
    setSaved(parts);
  }, [parts]);

  async function addPart(instrument: Instrument) {
    setPending((current) => ({ ...current, [instrument]: true }));
    setSaved((current) => ({ ...current, [instrument]: "pending" }));

    try {
      const body = new FormData();
      body.set("trackId", trackId);
      body.set("instrument", instrument);
      body.set("returnTo", returnTo);
      body.set("stay", "1");

      const response = await fetch("/api/add-part", {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
      const data = (await response.json().catch(() => null)) as
        | { ok: true; tabId: string }
        | { ok: false }
        | null;

      if (!response.ok || !data || !("tabId" in data) || !data.ok) {
        setSaved((current) => ({ ...current, [instrument]: null }));
        return;
      }

      setSaved((current) => ({ ...current, [instrument]: data.tabId }));
      onSaved?.(instrument, data.tabId);
    } catch {
      setSaved((current) => ({ ...current, [instrument]: null }));
    } finally {
      setPending((current) => ({ ...current, [instrument]: false }));
    }
  }

  async function removePart(instrument: Instrument, previous: string) {
    setPending((current) => ({ ...current, [instrument]: true }));
    setSaved((current) => ({ ...current, [instrument]: null }));

    try {
      const body = new FormData();
      body.set("trackId", trackId);
      body.set("instrument", instrument);
      body.set("returnTo", returnTo);

      const response = await fetch("/api/remove-part", {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean } | null;

      if (!response.ok || !data?.ok) {
        setSaved((current) => ({ ...current, [instrument]: previous }));
        return;
      }

      onRemoved?.(instrument);
    } catch {
      setSaved((current) => ({ ...current, [instrument]: previous }));
    } finally {
      setPending((current) => ({ ...current, [instrument]: false }));
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {INSTRUMENTS.map((instrument) => {
        const tabId = saved[instrument];
        const isSaved = Boolean(tabId);
        const isPending = Boolean(pending[instrument]);
        const className = cn(
          "flex size-12 items-center justify-center rounded-lg text-sm font-semibold",
          isSaved
            ? "bg-gold text-black"
            : "text-muted-foreground ring-1 ring-white/15 hover:bg-white/5 hover:text-foreground",
          active === instrument && "ring-2 ring-white",
          isPending && "opacity-70",
        );

        return (
          <form
            key={instrument}
            action={isSaved ? "/api/remove-part" : "/api/add-part"}
            method="post"
            onSubmit={(event) => {
              event.preventDefault();
              if (isPending) return;
              if (tabId) {
                void removePart(instrument, tabId);
                return;
              }
              void addPart(instrument);
            }}
          >
            <input type="hidden" name="trackId" value={trackId} />
            <input type="hidden" name="instrument" value={instrument} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="stay" value="1" />
            <button
              type="submit"
              disabled={isPending}
              aria-busy={isPending}
              aria-pressed={isSaved}
              aria-label={
                isSaved
                  ? `Remove ${INSTRUMENT_LABEL[instrument]} tab`
                  : `Add ${INSTRUMENT_LABEL[instrument]} tab`
              }
              className={className}
            >
              {INSTRUMENT_LETTER[instrument]}
            </button>
          </form>
        );
      })}
    </div>
  );
}
