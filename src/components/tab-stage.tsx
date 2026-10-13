"use client";

import { AlphaTabViewer } from "@/components/alpha-tab-viewer";
import { AttachTabForm } from "@/components/attach-tab-form";
import { soundsliceEmbedUrl } from "@/lib/soundslice";

export function TabStage({
  trackId,
  title,
  artist,
  tabTex,
  tabFile,
  tabFilename,
  soundsliceHash,
}: {
  trackId: string;
  title: string;
  artist: string;
  tabTex: string | null;
  tabFile: string | null;
  tabFilename: string | null;
  soundsliceHash: string | null;
}) {
  const hasAlphaTab = Boolean(tabFile || tabTex);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {soundsliceHash ? (
        <iframe
          title={`${title} tab`}
          src={soundsliceEmbedUrl(soundsliceHash)}
          className="min-h-[28rem] w-full flex-1 rounded-2xl bg-black/25 ring-1 ring-white/10"
          allow="autoplay"
        />
      ) : hasAlphaTab ? (
        <AlphaTabViewer tex={tabTex} fileBase64={tabFile} />
      ) : (
        <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-2xl bg-black/25 px-6 py-12 text-center ring-1 ring-white/10">
          <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Guitar tab</p>
          <p className="mt-3 max-w-md text-sm text-muted-foreground text-pretty">
            Upload a Guitar Pro file to render {title} here with alphaTab, or paste a Soundslice
            slice URL.
          </p>
        </div>
      )}
      <AttachTabForm
        trackId={trackId}
        artistName={artist}
        trackTitle={title}
        filename={tabFilename}
        soundsliceHash={soundsliceHash}
      />
    </div>
  );
}
