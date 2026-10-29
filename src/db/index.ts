import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL must point to your Supabase Postgres database.");
  const client = postgres(url, {
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: process.env.NODE_ENV === "production" ? "require" : undefined,
  });
  return drizzle(client, { schema });
}

let db: ReturnType<typeof createDb> | undefined;

export async function getDb() {
  db ??= createDb();
  return db;
}
