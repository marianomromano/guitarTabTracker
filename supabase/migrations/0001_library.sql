-- Credentials and password hashes are managed by Supabase in auth.users.
CREATE TABLE IF NOT EXISTS public.artists (
  id text PRIMARY KEY,
  name text NOT NULL,
  itunes_artist_id text
);
CREATE UNIQUE INDEX IF NOT EXISTS artists_name_idx ON public.artists(name);

CREATE TABLE IF NOT EXISTS public.albums (
  id text PRIMARY KEY,
  artist_id text NOT NULL REFERENCES public.artists(id),
  title text NOT NULL,
  itunes_collection_id text,
  artwork_url text,
  release_year integer
);
CREATE UNIQUE INDEX IF NOT EXISTS albums_itunes_idx ON public.albums(itunes_collection_id);

CREATE TABLE IF NOT EXISTS public.tracks (
  id text PRIMARY KEY,
  album_id text NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  title text NOT NULL,
  track_number integer NOT NULL,
  preview_url text,
  youtube_video_id text,
  apple_music_id text
);
CREATE INDEX IF NOT EXISTS tracks_album_idx ON public.tracks(album_id);

CREATE TABLE IF NOT EXISTS public.tabs (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id text NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  songsterr_id integer NOT NULL,
  songsterr_url text NOT NULL,
  instrument text NOT NULL DEFAULT 'guitar' CHECK (instrument IN ('guitar', 'bass', 'drums')),
  tab_tex text,
  tab_file text,
  tab_filename text,
  soundslice_hash text,
  created_at text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS tabs_user_track_instrument_idx ON public.tabs(user_id, track_id, instrument);

ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.artists, public.albums, public.tracks, public.tabs FROM anon, authenticated;
GRANT SELECT ON public.artists, public.albums, public.tracks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tabs TO authenticated;

CREATE POLICY artists_read ON public.artists FOR SELECT TO authenticated USING (true);
CREATE POLICY albums_read ON public.albums FOR SELECT TO authenticated USING (true);
CREATE POLICY tracks_read ON public.tracks FOR SELECT TO authenticated USING (true);
CREATE POLICY tabs_owner ON public.tabs FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
