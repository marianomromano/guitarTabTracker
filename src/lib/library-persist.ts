import fs from "node:fs";
import path from "node:path";
import { get, put } from "@vercel/blob";

const BLOB_PATH = "tabshelf/library.db";

export function resolveDbPath() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "tabshelf", "library.db");
  }
  return path.join(process.cwd(), "data", "library.db");
}

function blobEnabled() {
  return Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

export async function restoreLibrary() {
  if (!process.env.VERCEL || !blobEnabled()) return;

  const dbPath = resolveDbPath();
  if (fs.existsSync(dbPath)) return;

  try {
    const result = await Promise.race([
      get(BLOB_PATH, { access: "private", useCache: false }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    if (!result || result.statusCode !== 200 || !result.stream) return;

    const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
    if (bytes.length === 0) return;

    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, bytes);
  } catch (error) {
    console.error("Could not restore the TabShelf library", error);
  }
}

export async function persistLibrary() {
  if (!process.env.VERCEL || !blobEnabled()) return;

  const dbPath = resolveDbPath();
  if (!fs.existsSync(dbPath)) return;

  try {
    await put(BLOB_PATH, fs.readFileSync(dbPath), {
      access: "private",
      allowOverwrite: true,
      addRandomSuffix: false,
      cacheControlMaxAge: 0,
      contentType: "application/octet-stream",
    });
  } catch (error) {
    console.error("Could not persist the TabShelf library", error);
  }
}
