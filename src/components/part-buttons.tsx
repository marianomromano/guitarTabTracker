import Link from "next/link";
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
  returnTo = "/library",
}: {
  trackId: string;
  parts: InstrumentParts;
  collectionId?: string | null;
  trackNumber: number;
  active?: Instrument;
  returnTo?: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {INSTRUMENTS.map((instrument) => {
        const tabId = parts[instrument];
        const href = tabId
          ? collectionId
            ? `/tab/itunes-${collectionId}-${trackNumber}-${instrument}`
            : `/tab/${tabId}`
          : null;
        const className = cn(
          "flex size-12 items-center justify-center rounded-lg text-sm font-semibold",
          tabId
            ? "bg-gold text-black hover:bg-gold/90"
            : "text-muted-foreground ring-1 ring-white/15 hover:bg-white/5 hover:text-foreground",
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
          <form key={instrument} action="/api/add-part" method="post">
            <input type="hidden" name="trackId" value={trackId} />
            <input type="hidden" name="instrument" value={instrument} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button
              type="submit"
              aria-label={`Add ${INSTRUMENT_LABEL[instrument]} tab`}
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
