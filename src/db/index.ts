import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "library.db");

function ensureSchema(sqlite: InstanceType<typeof Database>) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS artists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      itunes_artist_id TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS artists_name_idx ON artists(name);

    CREATE TABLE IF NOT EXISTS albums (
      id TEXT PRIMARY KEY,
      artist_id TEXT NOT NULL REFERENCES artists(id),
      title TEXT NOT NULL,
      itunes_collection_id TEXT,
      artwork_url TEXT,
      release_year INTEGER
    );
    CREATE UNIQUE INDEX IF NOT EXISTS albums_itunes_idx ON albums(itunes_collection_id);

    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      track_number INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tabs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
      songsterr_id INTEGER NOT NULL,
      songsterr_url TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS tabs_user_track_idx ON tabs(user_id, track_id);
  `);
}

function createDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  ensureSchema(sqlite);
  return drizzle(sqlite, { schema });
}

let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}
