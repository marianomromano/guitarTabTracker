-- Reconcile imported UUID tracks with the iTunes IDs added during hydration.
LOCK TABLE public.tracks, public.tabs IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM public.tracks GROUP BY album_id, track_number
    HAVING count(DISTINCT lower(trim(title))) > 1
  ) THEN
    RAISE EXCEPTION 'Different songs share an album position; reconcile them before migration';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.tabs t JOIN public.tracks tr ON tr.id = t.track_id
    GROUP BY tr.album_id, tr.track_number, t.user_id, t.instrument HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate tracks have competing saved parts; reconcile attachments before migration';
  END IF;
END $$;
CREATE TEMP TABLE track_merge ON COMMIT DROP AS
  SELECT id AS old_id,
    first_value(id) OVER (PARTITION BY album_id, track_number ORDER BY (id LIKE 'itunes-%'), id) AS keep_id
  FROM public.tracks;
UPDATE public.tabs t SET track_id = m.keep_id FROM track_merge m
  WHERE t.track_id = m.old_id AND m.old_id <> m.keep_id;
UPDATE public.tracks t SET
  preview_url = coalesce(t.preview_url, s.preview_url),
  apple_music_id = coalesce(t.apple_music_id, s.apple_music_id),
  youtube_video_id = coalesce(t.youtube_video_id, s.youtube_video_id)
FROM (
  SELECT m.keep_id, max(tr.preview_url) AS preview_url,
    max(tr.apple_music_id) AS apple_music_id, max(tr.youtube_video_id) AS youtube_video_id
  FROM track_merge m JOIN public.tracks tr ON tr.id = m.old_id GROUP BY m.keep_id
) s WHERE t.id = s.keep_id;
DELETE FROM public.tracks t USING track_merge m WHERE t.id = m.old_id AND m.old_id <> m.keep_id;
CREATE UNIQUE INDEX IF NOT EXISTS tracks_album_number_idx ON public.tracks(album_id, track_number);
