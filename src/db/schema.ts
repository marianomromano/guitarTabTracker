import { integer, pgTable, text, uuid, uniqueIndex } from "drizzle-orm/pg-core";

export const artists = pgTable(
  "artists",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    itunesArtistId: text("itunes_artist_id"),
  },
  (table) => [uniqueIndex("artists_name_idx").on(table.name)],
);

export const albums = pgTable(
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

export const tracks = pgTable("tracks", {
  id: text("id").primaryKey(),
  albumId: text("album_id")
    .notNull()
    .references(() => albums.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  trackNumber: integer("track_number").notNull(),
  previewUrl: text("preview_url"),
  youtubeVideoId: text("youtube_video_id"),
  appleMusicId: text("apple_music_id"),
}, table => [uniqueIndex("tracks_album_number_idx").on(table.albumId, table.trackNumber)]);

export const tabs = pgTable(
  "tabs",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    trackId: text("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    songsterrId: integer("songsterr_id").notNull(),
    songsterrUrl: text("songsterr_url").notNull(),
    instrument: text("instrument").notNull().default("guitar"),
    tabTex: text("tab_tex"),
    tabFile: text("tab_file"),
    tabFilename: text("tab_filename"),
    soundsliceHash: text("soundslice_hash"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("tabs_user_track_instrument_idx").on(table.userId, table.trackId, table.instrument)],
);
