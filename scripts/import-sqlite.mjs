import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import postgres from "postgres";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const sourcePath = path.resolve(args.find((arg) => arg.startsWith("--source="))?.slice(9) || "data/library.db");
const mapPath = args.find((arg) => arg.startsWith("--owner-map="))?.slice(12);
const ownerMap = mapPath ? JSON.parse(fs.readFileSync(mapPath, "utf8")) : {};
const source = new Database(sourcePath, { readonly: true, fileMustExist: true });
const columns = {
  artists: ["id", "name", "itunes_artist_id"],
  albums: ["id", "artist_id", "title", "itunes_collection_id", "artwork_url", "release_year"],
  tracks: ["id", "album_id", "title", "track_number", "preview_url", "youtube_video_id", "apple_music_id"],
  tabs: ["id", "user_id", "track_id", "songsterr_id", "songsterr_url", "instrument", "tab_tex", "tab_file", "tab_filename", "soundslice_hash", "created_at"],
};
let rows;
try {
  // A read transaction gives a consistent snapshot, including data in SQLite's WAL.
  rows = source.transaction(() => Object.fromEntries(Object.entries(columns).map(([table, fields]) => [
    table, source.prepare(`SELECT * FROM ${table}`).all().map((row) => Object.fromEntries(
      fields.map((key) => [key, row[key] ?? (key === "instrument" ? "guitar" : null)]),
    )),
  ])))();
} finally {
  source.close();
}
console.log("Source rows:", Object.fromEntries(Object.entries(rows).map(([key, value]) => [key, value.length])));
const owners = [...new Set(rows.tabs.map((row) => row.user_id))];
const missing = owners.filter((owner) => !ownerMap[owner]);
if (missing.length) {
  console.log("Owner IDs requiring an explicit mapping to Supabase Auth UUIDs:", missing);
  if (apply) throw new Error("Supply --owner-map=/path/to/owners.json for every source owner. No rows were written.");
}
if (!apply) {
  console.log("Dry run only. Credentials are not imported. Add --apply and --owner-map after creating Supabase accounts.");
} else {
  const url = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_DIRECT_URL or DATABASE_URL.");
  const sql = postgres(url, { max: 1, prepare: false });
  try {
    await sql.begin(async (tx) => {
      for (const owner of owners) {
        const target = ownerMap[owner];
        const users = await tx`select id from auth.users where id = ${target}::uuid`;
        if (!users.length) throw new Error("An owner mapping does not refer to an existing Supabase Auth user.");
      }
      for (const [table, records] of Object.entries(rows)) {
        for (const record of records) {
          if (table === "tabs") record.user_id = ownerMap[record.user_id];
          // Reruns accept identical rows only; conflicting target data aborts the transaction.
          const existing = await tx`select * from ${tx(table)} where id = ${record.id}`;
          if (existing.length) {
            if (!columns[table].every((key) => existing[0][key] === record[key])) {
              throw new Error(`Conflicting ${table} row; import rolled back. Import into an empty project or reconcile first.`);
            }
            continue;
          }
          await tx`insert into ${tx(table)} ${tx(record, columns[table])}`;
        }
      }
    });
    console.log("Library imported successfully. Source SQLite database was not modified.");
  } finally {
    await sql.end();
  }
}
