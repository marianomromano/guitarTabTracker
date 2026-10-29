import fs from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;
if (!url) throw new Error("Set DATABASE_DIRECT_URL or DATABASE_URL before migrating.");
const sql = postgres(url, { max: 1, prepare: false });
try {
  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(73190521)`;
    await tx`create table if not exists public.tabshelf_migrations (name text primary key, applied_at timestamptz not null default now())`;
    await tx`revoke all on public.tabshelf_migrations from anon, authenticated`;
    await tx`alter table public.tabshelf_migrations enable row level security`;
    const directory = new URL("../supabase/migrations/", import.meta.url);
    for (const name of fs.readdirSync(directory).filter(name => name.endsWith(".sql")).sort()) {
      const applied = await tx`select name from public.tabshelf_migrations where name = ${name}`;
      if (applied.length) continue;
      await tx.unsafe(fs.readFileSync(new URL(name, directory), "utf8"));
      await tx`insert into public.tabshelf_migrations (name) values (${name})`;
    }
  });
  console.log("Supabase schema is up to date.");
} finally {
  await sql.end();
}
