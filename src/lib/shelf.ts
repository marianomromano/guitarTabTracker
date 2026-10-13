import { cookies } from "next/headers";

const SHELF_COOKIE = "tabshelf-shelf";
const MAX_ALBUMS = 80;

export async function readShelfCollectionIds() {
  const jar = await cookies();
  const raw = jar.get(SHELF_COOKIE)?.value ?? "";
  return [
    ...new Set(
      raw
        .split(",")
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  ];
}

export async function rememberShelfAlbum(collectionId: number) {
  if (!Number.isInteger(collectionId) || collectionId <= 0) return;
  const jar = await cookies();
  const next = [collectionId, ...(await readShelfCollectionIds()).filter((id) => id !== collectionId)].slice(
    0,
    MAX_ALBUMS,
  );
  jar.set(SHELF_COOKIE, next.join(","), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.VERCEL === "1",
  });
}
