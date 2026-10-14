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
}: {
  trackId: string;
  parts: InstrumentParts;
  collectionId?: string | null;
  trackNumber?: number;
  active?: Instrument;
  returnTo?: string;
  stayOnPage?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {INSTRUMENTS.map((instrument) => {
        const saved = Boolean(parts[instrument]);
        const className = cn(
          "flex size-12 items-center justify-center rounded-lg text-sm font-semibold",
          saved
            ? "bg-gold text-black"
            : "text-muted-foreground ring-1 ring-white/15 hover:bg-white/5 hover:text-foreground",
          active === instrument && "ring-2 ring-white",
        );

        if (saved) {
          return (
            <span
              key={instrument}
              aria-label={`${INSTRUMENT_LABEL[instrument]} saved`}
              className={className}
            >
              {INSTRUMENT_LETTER[instrument]}
            </span>
          );
        }

        return (
          <form key={instrument} action="/api/add-part" method="post">
            <input type="hidden" name="trackId" value={trackId} />
            <input type="hidden" name="instrument" value={instrument} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <input type="hidden" name="stay" value="1" />
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
