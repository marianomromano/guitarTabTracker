# Supabase setup and migration

The app now uses Supabase Postgres with Drizzle and Supabase Auth for passwords and sessions. Credentials live in Supabase's managed `auth.users` schema; no plaintext passwords or app-managed password hashes are stored in the library. SQLite and Vercel Blob are no longer used by the running app.

## Configure the project

1. Create a Supabase project. Copy its project URL, publishable API key, and Postgres connection URI into `.env.local` using `.env.example`. Keep `DATABASE_URL` server-only. Use the Connect dialog's pooler URI on Vercel. The driver disables prepared statements and limits each instance to one connection. Use `DATABASE_DIRECT_URL` for migrations when available.
2. Under Authentication, enable Email/password and Anonymous Sign-Ins (used by Try Demo). Configure a password minimum of at least 8 characters. Enable CAPTCHA/rate-limit settings appropriate to a public deployment.
3. Set the Auth Site URL to the deployed app origin and add `http://localhost:3000/auth/confirm` and `https://YOUR-APP/auth/confirm` to allowed redirect URLs.
4. For email confirmation, change the Confirm signup email template link to `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`. The `/auth/confirm` route also supports the standard PKCE `code` callback. Configure SMTP for production email delivery.
5. Run `npm run db:migrate`. This creates library tables, ownership references to Auth users, and Row Level Security policies. The SQL migration is recorded and applied once in a transaction. Do not use `db:push` as a substitute: the SQL migration also contains Auth foreign keys, permissions, and policies.

The app connects to Postgres using a privileged, server-only database connection and filters private tabs by the ID verified with Supabase Auth. RLS additionally restricts direct Data API access: signed-in users (including anonymous demo users) may read the shared catalog and access only their own tabs. Catalog writes are performed only by the app backend. No Supabase service-role key is required by the app.

## Import existing albums and tabs

1. Keep a backup of the current `data/library.db` and its WAL if the old app is running. Prefer stopping writes during the final import; the importer opens a read transaction and never modifies the SQLite source. If the latest data is in Vercel Blob, obtain that saved database and pass its path with `--source=...`.
2. Run `npm run db:import:sqlite` for a dry run. It reports row counts and legacy owner IDs without contacting Supabase.
3. Create/confirm the corresponding accounts in Supabase Auth. Existing app passwords use a custom scrypt format and are **not imported**; each account must choose a password through signup or a Supabase password reset/invitation flow. Existing app sessions also require a new sign-in.
4. Create a local JSON file mapping every reported old owner ID to the intended Supabase Auth user UUID, for example `{ "acct:you@example.com": "SUPABASE-USER-UUID", "local-dev": "SUPABASE-USER-UUID" }`. Verify ownership before mapping demo/shared IDs. This mapping file contains identifiers, not passwords; keep it out of Git.
5. Run `npm run db:import:sqlite -- --apply --owner-map=/absolute/path/owners.json`. Add `--source=/absolute/path/library.db` for a different source. The importer validates every destination Auth user and imports artists, albums, tracks, and tabs in one transaction. It preserves uploaded files and tab content. Identical rows are safe to rerun; conflicting rows or duplicate parts abort the import rather than overwrite data.
6. Check album/track/tab counts and sign into each account to verify ownership before deploying the new app. Configure the same Supabase environment variables in Vercel and redeploy. The old SQLite and Blob files can be retained as backups.

Try Demo creates a Supabase anonymous user. Signing in or confirming a new account in the same browser transfers that verified anonymous user's tabs. Confirmation on another browser cannot claim the original browser's demo session. Clearing cookies/signing out discards access to an unclaimed demo, so save it first. Old unsigned demo cookies are no longer accepted.

## Validation

Run `npm test`, `npm run lint`, and `npm run typecheck`. With a configured project, verify signup with confirmation enabled, confirmation callback, sign-in, refresh, sign-out, Try Demo, demo-to-account transfer, add/remove parts, uploads, and isolation between two accounts. Unit tests mock Supabase; they do not replace these live checks. Never deploy until the schema and data migration have completed.
