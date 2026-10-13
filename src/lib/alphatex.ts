import type { Instrument } from "@/lib/instrument";

function escapeTex(value: string) {
  return value.replace(/\\/g, "").replace(/"/g, "'").trim() || "Untitled";
}

export function placeholderAlphaTex(
  title: string,
  artist: string,
  instrument: Instrument = "guitar",
) {
  const header = `\\title "${escapeTex(title)}"
\\artist "${escapeTex(artist)}"`;

  if (instrument === "bass") {
    return `${header}
\\tuning e2 a2 d3 g3
\\instrument AcousticBass
.
\\ts 4 4
:4 r r r r | r r r r | r r r r | r r r r |`;
  }

  if (instrument === "drums") {
    return `${header}
\\instrument AcousticBassDrum
.
\\ts 4 4
:4 r r r r | r r r r | r r r r | r r r r |`;
  }

  return `${header}
.
\\ts 4 4
:4 r r r r | r r r r | r r r r | r r r r |`;
}

export function isAlphaTexFile(name: string) {
  return /\.(tex|alphatex|txt)$/i.test(name);
}

export function isTabFile(name: string) {
  return /\.(gp|gp3|gp4|gp5|gpx|gpb|xml|musicxml|tex|alphatex|txt)$/i.test(name);
}
