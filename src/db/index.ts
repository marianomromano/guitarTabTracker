import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import seed from "@/data/library-seed.json";
import * as schema from "./schema";

function resolveDbPath() {
  if (process.env.VERCEL) {
    // The deployment filesystem is read-only except /tmp.
    return path.join("/tmp", "tabshelf", "library.db");
  }
  return path.join(process.cwd(), "data", "library.db");
}

function ensureSchema(sqlite: InstanceType<typeof Database>) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);

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
      track_number INTEGER NOT NULL,
      preview_url TEXT,
      youtube_video_id TEXT,
      apple_music_id TEXT
    );

    CREATE TABLE IF NOT EXISTS tabs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
      songsterr_id INTEGER NOT NULL,
      songsterr_url TEXT NOT NULL,
      tab_tex TEXT,
      tab_file TEXT,
      tab_filename TEXT,
      soundslice_hash TEXT,
      instrument TEXT NOT NULL DEFAULT 'guitar',
      created_at TEXT NOT NULL
    );
  `);
}

function migrateSchema(sqlite: InstanceType<typeof Database>) {
  const trackColumns = sqlite.pragma("table_info(tracks)") as { name: string }[];
  if (!trackColumns.some((column) => column.name === "preview_url")) {
    sqlite.exec("ALTER TABLE tracks ADD COLUMN preview_url TEXT");
  }
  if (!trackColumns.some((column) => column.name === "youtube_video_id")) {
    sqlite.exec("ALTER TABLE tracks ADD COLUMN youtube_video_id TEXT");
  }
  if (!trackColumns.some((column) => column.name === "apple_music_id")) {
    sqlite.exec("ALTER TABLE tracks ADD COLUMN apple_music_id TEXT");
  }

  const tabColumns = sqlite.pragma("table_info(tabs)") as { name: string }[];
  if (!tabColumns.some((column) => column.name === "tab_tex")) {
    sqlite.exec("ALTER TABLE tabs ADD COLUMN tab_tex TEXT");
  }
  if (!tabColumns.some((column) => column.name === "tab_file")) {
    sqlite.exec("ALTER TABLE tabs ADD COLUMN tab_file TEXT");
  }
  if (!tabColumns.some((column) => column.name === "tab_filename")) {
    sqlite.exec("ALTER TABLE tabs ADD COLUMN tab_filename TEXT");
  }
  if (!tabColumns.some((column) => column.name === "soundslice_hash")) {
    sqlite.exec("ALTER TABLE tabs ADD COLUMN soundslice_hash TEXT");
  }
  if (!tabColumns.some((column) => column.name === "instrument")) {
    sqlite.exec("ALTER TABLE tabs ADD COLUMN instrument TEXT NOT NULL DEFAULT 'guitar'");
  }

  sqlite.exec("DROP INDEX IF EXISTS tabs_user_track_idx");
  sqlite.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS tabs_user_track_instrument_idx ON tabs(user_id, track_id, instrument)",
  );

  // The Clerk-era shelf belonged to marianomromano@icloud.com.
  sqlite
    .prepare(
      `UPDATE tabs SET user_id = 'acct:marianomromano@icloud.com'
       WHERE user_id IN ('user_3J8vUbeTly42OCV8LHmiMiJSKEU', 'acct:marianomromano@icloud')`,
    )
    .run();
}

function seedLibrary(sqlite: InstanceType<typeof Database>) {
  const insertArtist = sqlite.prepare(
    "INSERT OR IGNORE INTO artists (id, name, itunes_artist_id) VALUES (?, ?, ?)",
  );
  const insertAlbum = sqlite.prepare(
    `INSERT OR IGNORE INTO albums
      (id, artist_id, title, itunes_collection_id, artwork_url, release_year)
      VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const insertTrack = sqlite.prepare(
    "INSERT OR IGNORE INTO tracks (id, album_id, title, track_number) VALUES (?, ?, ?, ?)",
  );
  const insertTab = sqlite.prepare(
    `INSERT OR IGNORE INTO tabs
      (id, user_id, track_id, songsterr_id, songsterr_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
  );

  const apply = sqlite.transaction(() => {
    for (const artist of seed.artists) {
      insertArtist.run(artist.id, artist.name, artist.itunesArtistId);
    }
    for (const album of seed.albums) {
      insertAlbum.run(
        album.id,
        album.artistId,
        album.title,
        album.itunesCollectionId,
        album.artworkUrl,
        album.releaseYear,
      );
    }
    for (const track of seed.tracks) {
      insertTrack.run(track.id, track.albumId, track.title, track.trackNumber);
    }
    for (const tab of seed.tabs) {
      insertTab.run(
        tab.id,
        tab.userId,
        tab.trackId,
        tab.songsterrId,
        tab.songsterrUrl,
        tab.createdAt,
      );
    }
  });

  apply();
}

function createDb() {
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma(process.env.VERCEL ? "journal_mode = DELETE" : "journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  ensureSchema(sqlite);
  migrateSchema(sqlite);
  seedLibrary(sqlite);
  return drizzle(sqlite, { schema });
}

let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}
