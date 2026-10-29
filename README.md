# Guitar Tab Tracker

Albums, tracks, and tabs are stored in Supabase Postgres. Email/password accounts and sessions use Supabase Auth.

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for project configuration, schema migration, and importing the existing SQLite library. Configure `.env.local` before starting the app.

```bash
npm install
npm run db:migrate
npm run dev
```

Run `npm test`, `npm run lint`, and `npm run typecheck` for validation. `npm run db:import:sqlite` previews the existing library without writing to Supabase.
