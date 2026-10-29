"use client";

import { useRouter } from "next/navigation";
import { resolveTrackMediaAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePlayer, type PlayableTrack } from "@/components/player-provider";
import { StrataCoreKitHint } from "@/components/strata-core-kit";
import { itunesTabPath } from "@/lib/ids";
import { INSTRUMENT_LABEL, INSTRUMENTS, type Instrument } from "@/lib/instrument";

export type PickerSong = {
  id: string;
  title: string;
  artist: string;
  albumTitle?: string | null;
  artworkUrl: string | null;
  previewUrl: string | null;
  appleMusicId?: string | null;
  trackNumber: number;
  collectionId?: string | null;
  tabId?: string | null;
};

export function playSongWithLyrics(
  song: PickerSong,
  play: (track: PlayableTrack) => Promise<void>,
  openNowPlaying: () => void,
) {
  const next: PlayableTrack = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    albumTitle: song.albumTitle,
    artworkUrl: song.artworkUrl,
    previewUrl: song.previewUrl,
    appleMusicId: song.appleMusicId ?? null,
  };
  void play(next);
  openNowPlaying();
  if (!next.previewUrl) {
    void resolveTrackMediaAction(song.id).then((media) => {
      if (!media?.previewUrl) return;
      void play({
        ...next,
        previewUrl: media.previewUrl,
        appleMusicId: media.appleMusicId ?? next.appleMusicId,
      });
    });
  }
}

export function SongInstrumentPicker({
  song,
  onClose,
}: {
  song: PickerSong | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { play, openNowPlaying } = usePlayer();

  function tabHref(instrument: Instrument) {
    if (!song) return "/library";
    if (song.collectionId) {
      return itunesTabPath(Number(song.collectionId), song.trackNumber, instrument);
    }
    if (song.tabId) return `/tab/${song.tabId}`;
    return `/tab/${song.id}-${instrument}`;
  }

  function choose(instrument: Instrument) {
    if (!song) return;
    const href = tabHref(instrument);

    if (instrument === "drums") {
      playSongWithLyrics(song, play, openNowPlaying);
      onClose();
      return;
    }

    router.push(href);
  }

  return (
    <Dialog open={Boolean(song)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{song?.title ?? "Song"}</DialogTitle>
          <DialogDescription>{song?.artist}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 pt-2">
          {INSTRUMENTS.map((instrument) => (
            <div key={instrument}>
            <Button
              type="button"
              size="lg"
              className={
                instrument === "drums"
                  ? "h-16 w-full justify-start bg-gold text-lg text-black hover:bg-gold/90"
                  : "h-16 w-full justify-start text-lg"
              }
              variant={instrument === "drums" ? "default" : "outline"}
              onClick={() => void choose(instrument)}
            >
              {INSTRUMENT_LABEL[instrument]}
              <span className="ml-auto text-sm font-normal opacity-70">
                {instrument === "drums" ? "Lyrics" : "Tabs"}
              </span>
            </Button>
            {instrument === "drums" && song ? <StrataCoreKitHint artistName={song.artist} albumTitle={song.albumTitle} compact showFallback /> : null}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
