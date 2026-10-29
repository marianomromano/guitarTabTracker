import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("migration enforces ownership, account references, and catalog permissions", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create schema auth;
      create role anon;
      create role authenticated;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated;
      grant execute on function auth.uid() to authenticated;
    `);
    await db.exec(fs.readFileSync(new URL("../supabase/migrations/0001_library.sql", import.meta.url), "utf8"));
    const alice = "11111111-1111-4111-8111-111111111111";
    const bob = "22222222-2222-4222-8222-222222222222";
    await db.exec(`
      insert into auth.users values ('${alice}'), ('${bob}');
      insert into artists values ('artist', 'Artist', null);
      insert into albums values ('album', 'artist', 'Album', null, null, 2026);
      insert into tracks (id, album_id, title, track_number) values ('track', 'album', 'Song', 1);
      insert into tabs (id,user_id,track_id,songsterr_id,songsterr_url,created_at)
        values ('alice-tab','${alice}','track',0,'','now'), ('bob-tab','${bob}','track',0,'','now');
    `);
    await assert.rejects(db.exec(`insert into tabs (id,user_id,track_id,songsterr_id,songsterr_url,created_at) values ('orphan','33333333-3333-4333-8333-333333333333','track',0,'','now')`), /foreign key/);
    await db.exec(`set role authenticated; set request.jwt.claim.sub = '${alice}'`);
    assert.deepEqual((await db.query("select id from tabs")).rows, [{ id: "alice-tab" }]);
    assert.equal((await db.query("select id from albums")).rows.length, 1);
    await assert.rejects(db.exec("insert into artists values ('unauthorized','Other',null)"), /permission denied/);
    await assert.rejects(db.exec(`insert into tabs (id,user_id,track_id,songsterr_id,songsterr_url,instrument,created_at) values ('forged','${bob}','track',0,'','bass','now')`), /row-level security/);
    await db.exec("delete from tabs where id = 'bob-tab'");
    await db.exec(`set request.jwt.claim.sub = '${bob}'`);
    assert.deepEqual((await db.query("select id from tabs")).rows, [{ id: "bob-tab" }]);
    await db.exec("reset role; set role anon");
    await assert.rejects(db.query("select * from tabs"), /permission denied/);
    await db.exec("reset role");
    await db.exec(`delete from auth.users where id = '${alice}'`);
    assert.deepEqual((await db.query("select id from tabs")).rows, [{ id: "bob-tab" }]);
  } finally {
    await db.close();
  }
});
