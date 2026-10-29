import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { and, eq, inArray } from 'drizzle-orm';
const require = createRequire(import.meta.url);
const migration = fs.readFileSync(new URL('../supabase/migrations/0002_unique_album_tracks.sql', import.meta.url), 'utf8');
function schema() {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/db/schema.ts', import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require});
  return exports;
}
async function fixture() {
  const db = new PGlite();
  await db.exec(`create schema auth; create role anon; create role authenticated;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$ select null::uuid $$;`);
  await db.exec(fs.readFileSync(new URL('../supabase/migrations/0001_library.sql', import.meta.url),'utf8'));
  await db.exec(`
    insert into auth.users values ('11111111-1111-4111-8111-111111111111'),('22222222-2222-4222-8222-222222222222');
    insert into artists values ('artist','Artist',null);
    insert into albums values ('album','artist','Album','123',null,2026),('other','artist','Other',null,null,2026);
    insert into tracks(id,album_id,title,track_number) values ('legacy','album','Song',1),('itunes-123-1','album','Song',1),('other-track','other','Other',1);
    update tracks set preview_url='https://example.com/preview' where id='itunes-123-1';
    insert into tabs(id,user_id,track_id,songsterr_id,songsterr_url,tab_file,created_at) values
      ('alice','11111111-1111-4111-8111-111111111111','itunes-123-1',0,'','uploaded-content','now'),
      ('bob','22222222-2222-4222-8222-222222222222','legacy',0,'',null,'now'),
      ('alice-other','11111111-1111-4111-8111-111111111111','other-track',0,'',null,'now');
  `);
  return db;
}
test('duplicate repair preserves tabs and media, and prevents another copy',async()=>{
  const db=await fixture();
  try {
    await db.transaction(tx=>tx.exec(migration));
    assert.equal((await db.query("select * from tracks where album_id='album'")).rows.length,1);
    const saved=(await db.query("select track_id,tab_file from tabs where id='alice'")).rows[0];
    assert.equal(saved.track_id,'legacy');
    assert.equal(saved.tab_file,'uploaded-content');
    assert.equal((await db.query("select preview_url from tracks where id='legacy'")).rows[0].preview_url,'https://example.com/preview');
    await assert.rejects(db.exec("insert into tracks(id,album_id,title,track_number) values ('third','album','Song',1)"),/unique constraint/);
  } finally {await db.close();}
});
test('album deletion action removes only the authenticated account parts',async()=>{
  const client=await fixture();
  try {
    await client.transaction(tx=>tx.exec(migration));
    const tables=schema();
    const db=drizzle(client,{schema:tables});
    const exports={};
    const cleared=[];const refreshed=[];
    const source=ts.createSourceFile('actions.ts',fs.readFileSync(new URL('../src/app/actions.ts',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true);
    const action=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='deleteAlbumAction');
    vm.runInNewContext(ts.transpileModule(action.getText(source),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
      exports,and,eq,inArray,...tables,
      requireUserId:async()=> '11111111-1111-4111-8111-111111111111',getDb:async()=>db,
      forgetShelfAlbum:async id=>cleared.push(id),revalidatePath:path=>refreshed.push(path),
      saveFailed:error=>{throw error;},
    });
    assert.equal((await exports.deleteAlbumAction('album')).ok,true);
    const remaining=(await client.query('select id from tabs order by id')).rows.map(row=>row.id);
    assert.deepEqual(remaining,['alice-other','bob']);
    assert.equal((await client.query('select count(*)::int as n from albums')).rows[0].n,2);
    assert.deepEqual(cleared,[123]);
    assert.ok(refreshed.includes('/library'));
    assert.ok(refreshed.includes('/album/itunes-123'));
  }finally{await client.close();}
});
