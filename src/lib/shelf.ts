import { cookies } from "next/headers";
import { isInstrument, type Instrument } from "@/lib/instrument";

const SHELF_COOKIE = "tabshelf-shelf";
const MAX_ENTRIES = 120;

export type ShelfPart = {
  collectionId: number;
  trackNumber?: number;
  instrument: Instrument;
};

export async function readShelfParts(): Promise<ShelfPart[]> {
  const jar = await cookies();
  const raw = jar.get(SHELF_COOKIE)?.value ?? "";
  const parts: ShelfPart[] = [];

  for (const token of raw.split(",")) {
    const value = token.trim();
    if (!value) continue;
    const match = value.match(/^(\d+)(?:-(\d+)-(guitar|bass|drums))?$/);
    if (!match) continue;
    const collectionId = Number(match[1]);
    if (!Number.isInteger(collectionId) || collectionId <= 0) continue;
    if (match[2] && isInstrument(match[3])) {
      parts.push({
        collectionId,
        trackNumber: Number(match[2]),
        instrument: match[3],
      });
      continue;
    }
    parts.push({ collectionId, instrument: "guitar" });
  }

  return parts;
}

export async function rememberShelfPart(
  collectionId: number,
  trackNumber: number,
  instrument: Instrument,
) {
  await rememberShelfParts([{ collectionId, trackNumber, instrument }]);
}

export async function rememberShelfParts(parts: ShelfPart[]) {
  const incoming = parts.filter(
    (part) => Number.isInteger(part.collectionId) && part.collectionId > 0,
  );
  if (incoming.length === 0) return;

  const next = [...incoming];
  for (const part of await readShelfParts()) {
    if (
      next.some(
        (item) =>
          item.collectionId === part.collectionId &&
          item.trackNumber === part.trackNumber &&
          item.instrument === part.instrument,
      )
    ) {
      continue;
    }
    next.push(part);
  }
  await writeShelf(next.slice(0, MAX_ENTRIES));
}

async function writeShelf(parts: ShelfPart[]) {
  const jar = await cookies();
  const value = parts
    .map((part) =>
      part.trackNumber
        ? `${part.collectionId}-${part.trackNumber}-${part.instrument}`
        : String(part.collectionId),
    )
    .join(",");
  jar.set(SHELF_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.VERCEL === "1",
  });
}
