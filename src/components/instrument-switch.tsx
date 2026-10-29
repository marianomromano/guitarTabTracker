"use client";

import { useRouter } from "next/navigation";
import { playSongWithLyrics, type PickerSong } from "@/components/song-instrument-picker";
import { usePlayer, type PlayableTrack } from "@/components/player-provider";
import { itunesTabPath, parseItunesTabId } from "@/lib/ids";
import {
  INSTRUMENT_LABEL,
  INSTRUMENT_LETTER,
  INSTRUMENTS,
  type Instrument,
} from "@/lib/instrument";
import { cn } from "@/lib/utils";

export function pickerSongFromTrack(track: PlayableTrack): PickerSong {
  const parsed = parseItunesTabId(track.id);
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    albumTitle: track.albumTitle,
    artworkUrl: track.artworkUrl,
    previewUrl: track.previewUrl,
    appleMusicId: track.appleMusicId,
    trackNumber: parsed?.trackNumber ?? 0,
    collectionId: parsed ? String(parsed.collectionId) : null,
  };
}

export function InstrumentSwitch({
  song,
  active,
}: {
  song: PickerSong;
  active?: Instrument;
}) {
  const router = useRouter();
  const { play, openNowPlaying, closeNowPlaying } = usePlayer();

  function hrefFor(instrument: Instrument) {
    if (song.collectionId) {
      return itunesTabPath(Number(song.collectionId), song.trackNumber, instrument);
    }
    if (song.tabId) return `/tab/${song.tabId}`;
    return `/tab/${song.id}-${instrument}`;
  }

  function choose(instrument: Instrument) {
    if (instrument === "drums") {
      playSongWithLyrics(song, play, openNowPlaying);
      return;
    }
    closeNowPlaying();
    router.push(hrefFor(instrument));
  }

  return (
    <div className="flex shrink-0 items-center gap-2" role="group" aria-label="Switch instrument">
      {INSTRUMENTS.map((instrument) => (
        <button
          key={instrument}
          type="button"
          onClick={() => choose(instrument)}
          aria-pressed={active === instrument}
          aria-label={`Show ${INSTRUMENT_LABEL[instrument]} ${instrument === "drums" ? "lyrics" : "tabs"}`}
          className={cn(
            "flex size-12 items-center justify-center rounded-lg text-sm font-semibold",
            active === instrument
              ? "bg-gold text-black"
              : "text-muted-foreground ring-1 ring-border hover:bg-accent/50 hover:text-foreground",
          )}
        >
          {INSTRUMENT_LETTER[instrument]}
        </button>
      ))}
    </div>
  );
}
