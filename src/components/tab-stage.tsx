"use client";

import { ExternalLink } from "lucide-react";
import { AlphaTabViewer } from "@/components/alpha-tab-viewer";
import { AttachTabForm } from "@/components/attach-tab-form";
import { Button } from "@/components/ui/button";
import { UploadTabButton } from "@/components/upload-tab-button";
import { isProvidedTab } from "@/lib/alphatex";
import { INSTRUMENT_LABEL, type Instrument } from "@/lib/instrument";
import { soundsliceEmbedUrl } from "@/lib/soundslice";
import { songsterrTabUrl, ultimateGuitarTabUrl } from "@/lib/tab-links";

export function TabStage({
  trackId,
  title,
  artist,
  instrument = "guitar",
  tabTex,
  tabFile,
  tabFilename,
  soundsliceHash,
  songsterrUrl,
}: {
  trackId: string;
  title: string;
  artist: string;
  instrument?: Instrument;
  tabTex: string | null;
  tabFile: string | null;
  tabFilename: string | null;
  soundsliceHash: string | null;
  songsterrUrl?: string | null;
}) {
  const hasAlphaTab = isProvidedTab(tabFile, tabTex, title, artist, instrument);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {hasAlphaTab ? (
        <AlphaTabViewer tex={tabTex} fileBase64={tabFile} />
      ) : soundsliceHash ? (
        <iframe
          title={`${title} tab`}
          src={soundsliceEmbedUrl(soundsliceHash)}
          className="min-h-[28rem] w-full flex-1 rounded-2xl bg-card ring-1 ring-border"
          allow="autoplay"
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-card px-6 py-8 text-center ring-1 ring-border">
          <p className="text-[11px] tracking-[0.28em] text-primary uppercase">
            {INSTRUMENT_LABEL[instrument]} tab
          </p>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground text-pretty">
            No tab file is attached yet. Open {title} on Songsterr or Ultimate Guitar, or upload a
            Guitar Pro file to play it here in alphaTab.
          </p>
          <div className="mt-6 grid w-full max-w-4xl gap-3 sm:grid-cols-3">
            <Button asChild size="lg" className="h-16 bg-gold text-lg text-black hover:bg-gold/90">
              <a
                href={songsterrTabUrl(artist, title, songsterrUrl)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Songsterr
                <ExternalLink />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-16 border-border text-lg">
              <a
                href={ultimateGuitarTabUrl(artist, title, instrument)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Ultimate Guitar
                <ExternalLink />
              </a>
            </Button>
            <UploadTabButton trackId={trackId} instrument={instrument} />
          </div>
        </div>
      )}
      <AttachTabForm
        trackId={trackId}
        artistName={artist}
        trackTitle={title}
        instrument={instrument}
        filename={tabFilename}
        soundsliceHash={soundsliceHash}
        hasAlphaTab={hasAlphaTab}
      />
    </div>
  );
}
