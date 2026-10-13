function escapeTex(value: string) {
  return value.replace(/\\/g, "").replace(/"/g, "'").trim() || "Untitled";
}

export function placeholderAlphaTex(title: string, artist: string) {
  return `\\title "${escapeTex(title)}"
\\artist "${escapeTex(artist)}"
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
