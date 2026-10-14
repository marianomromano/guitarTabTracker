export type LyricLine = {
  time: number | null;
  text: string;
};

export type LyricsResult = {
  instrumental: boolean;
  source: "synced" | "plain" | "none";
  lines: LyricLine[];
};

export function parseSyncedLyrics(raw: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const row of raw.split(/\r?\n/)) {
    const stamps = [...row.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g)];
    if (stamps.length === 0) continue;
    const text = row.slice((stamps[stamps.length - 1].index ?? 0) + stamps[stamps.length - 1][0].length).trim();
    for (const stamp of stamps) {
      const minutes = Number(stamp[1]);
      const seconds = Number(stamp[2]);
      const fraction = stamp[3] ? Number(stamp[3].padEnd(3, "0")) / 1000 : 0;
      lines.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }
  return lines.sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
}

export function parsePlainLyrics(raw: string): LyricLine[] {
  return raw
    .split(/\r?\n/)
    .map((text) => text.trimEnd())
    .filter((text, index, rows) => text.length > 0 || (index > 0 && index < rows.length - 1))
    .map((text) => ({ time: null, text }));
}

export function activeLyricIndex(lines: LyricLine[], time: number) {
  let index = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const at = lines[i].time;
    if (at == null) return -1;
    if (at <= time) index = i;
    else break;
  }
  return index;
}
