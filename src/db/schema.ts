import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const artists = sqliteTable(
  "artists",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    itunesArtistId: text("itunes_artist_id"),
  },
  (table) => [uniqueIndex("artists_name_idx").on(table.name)],
);

export const albums = sqliteTable(
  "albums",
  {
    id: text("id").primaryKey(),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id),
    title: text("title").notNull(),
    itunesCollectionId: text("itunes_collection_id"),
    artworkUrl: text("artwork_url"),
    releaseYear: integer("release_year"),
  },
  (table) => [uniqueIndex("albums_itunes_idx").on(table.itunesCollectionId)],
);

export const tracks = sqliteTable("tracks", {
  id: text("id").primaryKey(),
  albumId: text("album_id")
    .notNull()
    .references(() => albums.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  trackNumber: integer("track_number").notNull(),
  previewUrl: text("preview_url"),
  youtubeVideoId: text("youtube_video_id"),
  appleMusicId: text("apple_music_id"),
});

export const tabs = sqliteTable(
  "tabs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    trackId: text("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    songsterrId: integer("songsterr_id").notNull(),
    songsterrUrl: text("songsterr_url").notNull(),
    tabTex: text("tab_tex"),
    tabFile: text("tab_file"),
    tabFilename: text("tab_filename"),
    soundsliceHash: text("soundslice_hash"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("tabs_user_track_idx").on(table.userId, table.trackId)],
);
