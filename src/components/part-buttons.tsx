"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { addPartAction } from "@/app/actions";
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
  collectionId,
  trackNumber,
  active,
}: {
  trackId: string;
  parts: InstrumentParts;
  collectionId?: string | null;
  trackNumber: number;
  active?: Instrument;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 items-center gap-1">
      {INSTRUMENTS.map((instrument) => {
        const tabId = parts[instrument];
        const href = tabId
          ? collectionId
            ? `/tab/itunes-${collectionId}-${trackNumber}-${instrument}`
            : `/tab/${tabId}`
          : null;
        const className = cn(
          "flex size-10 items-center justify-center rounded-md text-xs font-semibold md:size-8",
          tabId ? "bg-gold text-black hover:bg-gold/90" : "text-muted-foreground ring-1 ring-white/15 hover:bg-white/5 hover:text-foreground",
          active === instrument && "ring-2 ring-white",
        );

        if (href) {
          return (
            <Link
              key={instrument}
              href={href}
              aria-label={`${INSTRUMENT_LABEL[instrument]} tab`}
              aria-current={active === instrument ? "page" : undefined}
              className={className}
            >
              {INSTRUMENT_LETTER[instrument]}
            </Link>
          );
        }

        return (
          <button
            key={instrument}
            type="button"
            disabled={pending}
            aria-label={`Add ${INSTRUMENT_LABEL[instrument]} tab`}
            onClick={() => {
              startTransition(async () => {
                const result = await addPartAction({ trackId, instrument });
                if (result.ok) {
                  router.push(result.tabHref);
                  router.refresh();
                }
              });
            }}
            className={className}
          >
            {INSTRUMENT_LETTER[instrument]}
          </button>
        );
      })}
    </div>
  );
}
