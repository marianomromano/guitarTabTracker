import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

test("SQLite import dry run preserves the source and apply requires an owner mapping", () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "tabshelf-import-"));
  try {
    const source = path.join(folder, "library.db");
    const db = new Database(source);
    db.exec(`
      create table artists (id text, name text, itunes_artist_id text);
      create table albums (id text, artist_id text, title text);
      create table tracks (id text, album_id text, title text, track_number integer);
      create table tabs (id text, user_id text, track_id text, songsterr_id integer, songsterr_url text, created_at text);
      insert into artists values ('artist','Artist',null);
      insert into albums values ('album','artist','Album');
      insert into tracks values ('track','album','Song',1);
      insert into tabs values ('tab','legacy-owner','track',0,'','now');
    `);
    db.close();
    const before = fs.readFileSync(source);
    const script = fileURLToPath(new URL("../scripts/import-sqlite.mjs", import.meta.url));
    const env = { ...process.env, DATABASE_URL: "", DATABASE_DIRECT_URL: "" };
    const dry = spawnSync(process.execPath, [script, `--source=${source}`], { encoding: "utf8", env });
    assert.equal(dry.status, 0, dry.stderr);
    assert.match(dry.stdout, /Dry run only/);
    assert.match(dry.stdout, /legacy-owner/);
    assert.deepEqual(fs.readFileSync(source), before);
    const apply = spawnSync(process.execPath, [script, `--source=${source}`, "--apply"], { encoding: "utf8", env });
    assert.notEqual(apply.status, 0);
    assert.match(apply.stderr, /Supply --owner-map/);
    assert.deepEqual(fs.readFileSync(source), before);
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
});
