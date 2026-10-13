export const INSTRUMENTS = ["guitar", "bass", "drums"] as const;

export type Instrument = (typeof INSTRUMENTS)[number];

export const INSTRUMENT_LABEL: Record<Instrument, string> = {
  guitar: "Guitar",
  bass: "Bass",
  drums: "Drums",
};

export const INSTRUMENT_LETTER: Record<Instrument, string> = {
  guitar: "G",
  bass: "B",
  drums: "D",
};

export type InstrumentParts = Record<Instrument, string | null>;

export function emptyParts(): InstrumentParts {
  return { guitar: null, bass: null, drums: null };
}

export function hasAnyPart(parts: InstrumentParts) {
  return Boolean(parts.guitar || parts.bass || parts.drums);
}

export function primaryPart(parts: InstrumentParts): Instrument | null {
  return INSTRUMENTS.find((instrument) => parts[instrument]) ?? null;
}

export function isInstrument(value: string | null | undefined): value is Instrument {
  return value === "guitar" || value === "bass" || value === "drums";
}

export function parseInstrument(value: string | null | undefined): Instrument {
  return isInstrument(value) ? value : "guitar";
}

export function parseInstruments(values: string[] | null | undefined): Instrument[] {
  const unique = [...new Set((values ?? []).filter(isInstrument))];
  return unique.length ? unique : ["guitar"];
}
